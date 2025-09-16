import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { PatientFile } from './entities/patient-file.entity';
import { UploadFileDto, FileResponseDto, FileType } from './dto/file.dto';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { LoggerService } from 'src/common/logger/logger.service';

@Injectable()
export class FilesService {
    private readonly bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'patient-manager';
    private readonly supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    constructor(
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        @InjectRepository(PatientFile)
        private readonly patientFileRepository: Repository<PatientFile>,
        private readonly logger: LoggerService,
    ) {}

    private async uploadToSupabase(file: Express.Multer.File, filename: string): Promise<string> {
        try {
            const filePath = `patients/${filename}`;
            
            this.logger.debug(`Uploading file to Supabase: ${filename}`, 'FilesService');

            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (error) {
                this.logger.error(`Supabase upload error: ${error.message}`, error.stack, 'FilesService');
                throw new Error(`Supabase upload failed: ${error.message}`);
            }

            this.logger.log(`Upload successful for file: ${filename}`, 'FilesService');

            const { data: publicUrlData } = this.supabase.storage
                .from(this.bucketName)
                .getPublicUrl(filePath);

            return publicUrlData.publicUrl;
        } catch (error) {
            this.logger.error(`Supabase upload error: ${error.message}`, error.stack, 'FilesService');
            throw new InternalServerErrorException(`Failed to upload file to Supabase: ${error.message}`);
        }
    }

    private async downloadFromSupabase(filename: string): Promise<Buffer> {
        try {
            const filePath = `patients/${filename}`;
            
            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .download(filePath);

            if (error) {
                this.logger.error(`Supabase download error: ${error.message}`, error.stack, 'FilesService');
                throw new NotFoundException('File not found in Supabase storage');
            }

            const arrayBuffer = await data.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            this.logger.error(`Supabase download error: ${error.message}`, error.stack, 'FilesService');
            throw new NotFoundException('File not found');
        }
    }

    private async deleteFromSupabase(filename: string): Promise<void> {
        try {
            const filePath = `patients/${filename}`;
            
            const { error } = await this.supabase.storage
                .from(this.bucketName)
                .remove([filePath]);

            if (error) {
                this.logger.warn(`Failed to delete file from Supabase: ${error.message}`, 'FilesService');
            }
        } catch (error) {
            this.logger.warn(`Supabase delete error: ${error.message}`, 'FilesService');
        }
    }

    async uploadFile(
        file: Express.Multer.File,
        uploadFileDto: UploadFileDto,
        uploadedBy?: string
    ): Promise<FileResponseDto> {
        this.logger.log(`Starting file upload: ${file.originalname} for patient ${uploadFileDto.patientId}`, 'FilesService');
        
        try {
            const fileExtension = path.extname(file.originalname);
            const filename = `${uuidv4()}${fileExtension}`;
            
            const publicUrl = await this.uploadToSupabase(file, filename);
            const storagePath = `supabase:patients/${filename}`;

            const fileEntity = this.fileRepository.create({
                filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                storagePath,
                publicUrl,
                uploadedBy,
            });

            const savedFile = await this.fileRepository.save(fileEntity);

            if (uploadFileDto.isPrimary) {
                await this.patientFileRepository.update(
                    {
                        patientId: uploadFileDto.patientId,
                        fileType: uploadFileDto.fileType,
                    },
                    { isPrimary: false }
                );
            }

            const patientFile = this.patientFileRepository.create({
                patientId: uploadFileDto.patientId,
                fileId: savedFile.id,
                fileType: uploadFileDto.fileType,
                isPrimary: uploadFileDto.isPrimary || false,
            });

            await this.patientFileRepository.save(patientFile);

            this.logger.log(`File upload completed successfully: ${savedFile.id} for patient ${uploadFileDto.patientId}`, 'FilesService');

            return {
                id: savedFile.id,
                originalName: savedFile.originalName,
                mimeType: savedFile.mimeType,
                sizeBytes: savedFile.sizeBytes,
                publicUrl: savedFile.publicUrl,
                uploadedAt: savedFile.uploadedAt,
                fileType: uploadFileDto.fileType,
                isPrimary: uploadFileDto.isPrimary || false,
            };
        } catch (error) {
            this.logger.error(`Failed to upload file: ${file.originalname}`, error.stack, 'FilesService');
            throw new InternalServerErrorException('Failed to upload file');
        }
    }

    async getPatientFiles(patientId: string, fileType?: FileType): Promise<FileResponseDto[]> {
        this.logger.debug(`Retrieving files for patient: ${patientId}${fileType ? ` with type: ${fileType}` : ''}`, 'FilesService');
        
        const query = this.patientFileRepository
            .createQueryBuilder('pf')
            .leftJoinAndSelect('pf.file', 'file')
            .where('pf.patientId = :patientId', { patientId });

        if (fileType) {
            query.andWhere('pf.fileType = :fileType', { fileType });
        }

        query.orderBy('pf.createdAt', 'DESC');

        const patientFiles = await query.getMany();

        return patientFiles.map(pf => ({
            id: pf.file.id,
            originalName: pf.file.originalName,
            mimeType: pf.file.mimeType,
            sizeBytes: pf.file.sizeBytes,
            publicUrl: pf.file.publicUrl,
            uploadedAt: pf.file.uploadedAt,
            fileType: pf.fileType as FileType,
            isPrimary: pf.isPrimary,
        }));
    }

    async deleteFile(patientId: string, fileId: string): Promise<void> {
        this.logger.log(`Deleting file: ${fileId} for patient: ${patientId}`, 'FilesService');
        
        const patientFile = await this.patientFileRepository.findOne({
            where: { patientId, fileId },
            relations: ['file'],
        });

        if (!patientFile) {
            throw new NotFoundException('Patient file relationship not found');
        }

        try {
            await this.deleteFromSupabase(patientFile.file.filename);
        } catch (error) {
            this.logger.warn(`Failed to delete file from storage: ${error.message}`, 'FilesService');
        }

        await this.patientFileRepository.delete({ id: patientFile.id });

        const otherUsages = await this.patientFileRepository.count({
            where: { fileId },
        });

        if (otherUsages === 0) {
            await this.fileRepository.delete({ id: fileId });
        }
    }

    async downloadFile(filename: string): Promise<{ file: Buffer; mimeType: string; originalName: string }> {
        const fileEntity = await this.fileRepository.findOne({ where: { filename } });
        
        if (!fileEntity) {
            throw new NotFoundException('File not found');
        }

        try {
            const fileBuffer = await this.downloadFromSupabase(fileEntity.filename);

            return {
                file: fileBuffer,
                mimeType: fileEntity.mimeType,
                originalName: fileEntity.originalName,
            };
        } catch (error) {
            throw new NotFoundException('File not found on storage');
        }
    }

    async generateFileUrl(filename: string, expiresIn?: number): Promise<string> {
        const fileEntity = await this.fileRepository.findOne({ where: { filename } });
        
        if (!fileEntity) {
            throw new NotFoundException('File not found');
        }

        const filePath = `patients/${filename}`;

        if (expiresIn) {
            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .createSignedUrl(filePath, expiresIn);

            if (error) {
                this.logger.error(`Error creating signed URL: ${error.message}`, error.stack, 'FilesService');
                const { data: publicUrlData } = this.supabase.storage
                    .from(this.bucketName)
                    .getPublicUrl(filePath);
                return publicUrlData.publicUrl;
            }

            return data.signedUrl;
        } else {
            const { data: publicUrlData } = this.supabase.storage
                .from(this.bucketName)
                .getPublicUrl(filePath);
            return publicUrlData.publicUrl;
        }
    }

    async generateFileUrlById(fileId: string, expiresIn?: number): Promise<string | null> {
        const fileEntity = await this.fileRepository.findOne({ where: { id: fileId } });
        
        if (!fileEntity) {
            return null;
        }

        return this.generateFileUrl(fileEntity.filename, expiresIn);
    }
}