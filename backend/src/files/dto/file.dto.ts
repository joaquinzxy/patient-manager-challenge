import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsUUID } from 'class-validator';

export enum FileType {
    ID_PHOTO = 'id_photo',
    MEDICAL_RECORD = 'medical_record',
    PRESCRIPTION = 'prescription',
    LAB_RESULT = 'lab_result',
    INSURANCE_CARD = 'insurance_card',
    OTHER = 'other'
}

export class UploadFileDto {
    @ApiProperty({ description: 'Patient ID to associate the file with' })
    @IsUUID()
    patientId: string;

    @ApiProperty({ enum: FileType, description: 'Type of file being uploaded' })
    @IsEnum(FileType)
    fileType: FileType;

    @ApiProperty({ description: 'Whether this should be the primary file for this type', required: false })
    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;
}

export class FileResponseDto {
    @ApiProperty({ description: 'File ID' })
    id: string;

    @ApiProperty({ description: 'Original filename' })
    originalName: string;

    @ApiProperty({ description: 'File MIME type' })
    mimeType: string;

    @ApiProperty({ description: 'File size in bytes' })
    sizeBytes: number;

    @ApiProperty({ description: 'Public URL if available' })
    publicUrl?: string;

    @ApiProperty({ description: 'Upload timestamp' })
    uploadedAt: Date;

    @ApiProperty({ enum: FileType, description: 'Type of file' })
    fileType: FileType;

    @ApiProperty({ description: 'Whether this is the primary file for this type' })
    isPrimary: boolean;
}

export class UpdateFileDto {
    @ApiProperty({ enum: FileType, description: 'Type of file', required: false })
    @IsOptional()
    @IsEnum(FileType)
    fileType?: FileType;

    @ApiProperty({ description: 'Whether this should be the primary file for this type', required: false })
    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean;
}
