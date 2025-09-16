import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PatientFile } from './patient-file.entity';

@Entity('files')
export class File {
    @ApiProperty({ description: 'Unique identifier for the file' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ description: 'Generated filename for storage' })
    @Column({ type: 'varchar' })
    filename: string;

    @ApiProperty({ description: 'Original filename when uploaded' })
    @Column({ type: 'varchar' })
    originalName: string;

    @ApiProperty({ description: 'MIME type of the file' })
    @Column({ type: 'varchar' })
    mimeType: string;

    @ApiProperty({ description: 'File size in bytes' })
    @Column({ type: 'integer' })
    sizeBytes: number;

    @ApiProperty({ description: 'Storage path for the file' })
    @Column({ type: 'varchar' })
    storagePath: string;

    @ApiProperty({ description: 'Public URL if available', required: false })
    @Column({ type: 'varchar', nullable: true })
    publicUrl?: string;

    @ApiProperty({ description: 'When the file was uploaded' })
    @CreateDateColumn()
    uploadedAt: Date;

        @ApiProperty({ description: 'User who uploaded the file', required: false })
    @Column({ type: 'uuid', nullable: true })
    uploadedBy?: string;

    @OneToMany(() => PatientFile, patientFile => patientFile.file)
    patientFiles: PatientFile[];
}
