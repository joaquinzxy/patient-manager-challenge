import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { PaginatedResult, PaginationOptions, PaginationMeta } from '../interfaces/pagination.interface';

@Injectable()
export class PaginationService {
  /**
   * Paginate results from a TypeORM repository
   */
  async paginate<T extends ObjectLiteral>(
    repository: Repository<T>,
    options: PaginationOptions,
    searchFields?: string[],
  ): Promise<PaginatedResult<T>> {
    const queryBuilder = repository.createQueryBuilder('entity');
    return this.paginateQueryBuilder(queryBuilder, options, searchFields);
  }

  /**
   * Paginate results from a TypeORM QueryBuilder
   */
  async paginateQueryBuilder<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    options: PaginationOptions,
    searchFields?: string[],
  ): Promise<PaginatedResult<T>> {
    const { page, limit, sortBy, sortOrder, search } = options;
    
    // Apply search if provided
    if (search && searchFields && searchFields.length > 0) {
      const searchConditions = searchFields
        .map((field, index) => `${queryBuilder.alias}.${field} ILIKE :search${index}`)
        .join(' OR ');
      
      queryBuilder.andWhere(`(${searchConditions})`, 
        searchFields.reduce((params, field, index) => {
          params[`search${index}`] = `%${search}%`;
          return params;
        }, {})
      );
    }

    // Apply sorting
    if (sortBy) {
      queryBuilder.orderBy(`${queryBuilder.alias}.${sortBy}`, sortOrder || 'ASC');
    } else {
      // Default sorting by id if no sortBy is provided
      queryBuilder.orderBy(`${queryBuilder.alias}.id`, 'DESC');
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Get results and total count
    const [data, total] = await queryBuilder.getManyAndCount();

    // Calculate pagination metadata
    const meta = this.createPaginationMeta(page, limit, total);

    return {
      data,
      meta,
    };
  }

  /**
   * Create pagination metadata
   */
  private createPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  createPaginationLinks(
    baseUrl: string,
    page: number,
    totalPages: number,
    queryParams?: Record<string, any>,
  ) {
    const createUrl = (pageNum: number) => {
      const params = new URLSearchParams({
        ...queryParams,
        page: pageNum.toString(),
      });
      return `${baseUrl}?${params.toString()}`;
    };

    const links: any = {
      current: createUrl(page),
    };

    if (page > 1) {
      links.first = createUrl(1);
      links.previous = createUrl(page - 1);
    }

    if (page < totalPages) {
      links.next = createUrl(page + 1);
      links.last = createUrl(totalPages);
    }

    return links;
  }
}
