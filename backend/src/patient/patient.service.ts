import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Patient } from './entities/patient.entity';
import { EmailService } from 'src/email/email.service';
import { EmailVerificationService } from 'src/auth/email-verification-token.service';
import { PaginationService } from '../common/services/pagination.service';
import { PaginatedResult, PaginationOptions } from '../common/interfaces/pagination.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilesService } from '../files/files.service';
import { FileType } from '../files/dto/file.dto';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private emailService: EmailService,
    private emailVerificationService: EmailVerificationService,
    private paginationService: PaginationService,
    private filesService: FilesService,
    private readonly logger: LoggerService,
  ) { }

  async create(createPatientDto: CreatePatientDto, image?: Express.Multer.File): Promise<Patient> {
    this.logger.log(`Creating new patient with email: ${createPatientDto.email}`, 'PatientService');
    
    const normalizedEmail = createPatientDto.email.toLowerCase().trim();

    const existingPatient = await this.patientRepository.findOne({
      where: { email: normalizedEmail }
    });

    if (existingPatient && !existingPatient!.isDeleted) {
      throw new ConflictException('Patient with this email already exists');
    }

    if (existingPatient && existingPatient!.isDeleted) {
      throw new ConflictException('This email was previously used by a deleted patient. Please use a different email or restore the deleted patient.');
    }

    const patient = this.patientRepository.create({
      ...createPatientDto,
      email: normalizedEmail,
      name: createPatientDto.name.trim(),
      phoneNumber: createPatientDto.phoneNumber.trim(),
    });

    const savedPatient = await this.patientRepository.save(patient);

    if (image) {
      try {
        const uploadResult = await this.filesService.uploadFile(image, {
          patientId: savedPatient.id,
          fileType: FileType.ID_PHOTO,
          isPrimary: true
        });

        savedPatient.documentFileId = uploadResult.id;
        await this.patientRepository.save(savedPatient);

        this.logger.log(`Document photo uploaded successfully for patient ${savedPatient.id}: ${uploadResult.originalName}`, 'PatientService');
      } catch (error) {
        this.logger.error(`Failed to upload document photo for patient ${savedPatient.id}`, error.stack, 'PatientService');
      }
    }

    try {
      await this.emailVerificationService.sendInitialVerification(savedPatient.id);
      this.logger.log(`Verification notification sent to patient ${savedPatient.id}`, 'PatientService');

    } catch (error) {
      this.logger.error(`Failed to send verification notification to patient ${savedPatient.id}`, error.stack, 'PatientService');
    }

    this.logger.log(`Patient created successfully with ID: ${savedPatient.id}`, 'PatientService');
    return savedPatient;
  }

  async findAll(paginationDto?: PaginationDto): Promise<PaginatedResult<Patient & { documentPhotoUrl: string | null }>> {
    this.logger.debug(`Retrieving patients with pagination: page ${paginationDto?.page || 1}, limit ${paginationDto?.limit || 10}`, 'PatientService');
    
    const options: PaginationOptions = {
      page: paginationDto?.page ?? 1,
      limit: paginationDto?.limit ?? 10,
      sortBy: paginationDto?.sortBy,
      sortOrder: paginationDto?.sortOrder,
      search: paginationDto?.search,
    };

    const queryBuilder = this.patientRepository
      .createQueryBuilder('patient')
      .where('patient.isDeleted = :isDeleted', { isDeleted: false });

    const searchFields = ['name', 'email', 'phoneNumber'];

    const result = await this.paginationService.paginateQueryBuilder(
      queryBuilder,
      options,
      searchFields,
    );

    const enhancedPatients = await Promise.all(
      result.data.map(async (patient) => {
        const documentPhotoUrl = patient.documentFileId
          ? await this.filesService.generateFileUrlById(
            patient.documentFileId,
            3600)
          : null;

        return {
          ...patient,
          documentPhotoUrl
        };
      })
    );

    return {
      ...result,
      data: enhancedPatients
    };
  }

  async findOne(id: string): Promise<Patient & { documentPhotoUrl: string | null }> {
    this.logger.debug(`Finding patient with ID: ${id}`, 'PatientService');
    
    const patient = await this.patientRepository.findOne({
      where: { id, isDeleted: false }
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    const documentPhotoUrl = patient.documentFileId
      ? await this.filesService.generateFileUrlById(
        patient.documentFileId,
        3600)
      : null;

    return {
      ...patient,
      documentPhotoUrl
    };
  }

  async update(id: string, updatePatientDto: UpdatePatientDto): Promise<Patient> {
    this.logger.log(`Updating patient with ID: ${id}`, 'PatientService');
    
    const patient = await this.findOne(id);

    const updateData = { ...updatePatientDto };
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase().trim();
    }
    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }
    if (updateData.phoneNumber) {
      updateData.phoneNumber = updateData.phoneNumber.trim();
    }

    if (updateData.email && updateData.email !== patient.email) {
      const existingPatient = await this.patientRepository.findOne({
        where: { email: updateData.email }
      });

      if (existingPatient && existingPatient.id !== id) {
        if (!existingPatient.isDeleted) {
          throw new ConflictException('Patient with this email already exists');
        } else {
          throw new ConflictException('This email was previously used by a deleted patient. Please use a different email or restore the deleted patient.');
        }
      }
    }

    Object.assign(patient, updateData);
    const updatedPatient = await this.patientRepository.save(patient);
    this.logger.log(`Patient updated successfully with ID: ${id}`, 'PatientService');
    return updatedPatient;
  }

  async remove(id: string): Promise<{ message: string }> {
    this.logger.log(`Soft deleting patient with ID: ${id}`, 'PatientService');
    
    const patient = await this.findOne(id);

    patient.isDeleted = true;
    await this.patientRepository.save(patient);

    this.logger.log(`Patient soft deleted successfully with ID: ${id}`, 'PatientService');
    return { message: `Patient with ID ${id} has been deleted successfully` };
  }

  async restore(id: string): Promise<Patient> {
    this.logger.log(`Restoring deleted patient with ID: ${id}`, 'PatientService');
    
    const patient = await this.patientRepository.findOne({
      where: { id, isDeleted: true }
    });

    if (!patient) {
      throw new NotFoundException(`Deleted patient with ID ${id} not found`);
    }

    patient.isDeleted = false;
    const restoredPatient = await this.patientRepository.save(patient);

    this.logger.log(`Patient restored successfully with ID: ${id}`, 'PatientService');
    return restoredPatient;
  }

  async findDeleted(): Promise<Patient[]> {
    return await this.patientRepository.find({
      where: { isDeleted: true },
      order: { updatedAt: 'DESC' }
    });
  }

  async findAllIncludingDeleted(): Promise<Patient[]> {
    return await this.patientRepository.find({
      order: { addedAt: 'DESC' }
    });
  }

  async uploadPatientFile(patientId: string, file: Express.Multer.File, fileType: FileType, isPrimary = false) {
    const patient = await this.findOne(patientId);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.filesService.uploadFile(file, {
      patientId,
      fileType,
      isPrimary
    });
  }

  async deletePatientFile(patientId: string, fileId: string) {
    const patient = await this.findOne(patientId);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.filesService.deleteFile(patientId, fileId);
  }
}
