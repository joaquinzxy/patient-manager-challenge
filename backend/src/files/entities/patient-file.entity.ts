import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Patient } from '../../patient/entities/patient.entity';
import { File } from './file.entity';

@Entity('patient_files')
@Index(['patientId', 'fileType'])
export class PatientFile {
    @ApiProperty({ description: 'Unique identifier for the patient file relationship' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ description: 'Patient ID' })
    @Column({ type: 'uuid' })
    patientId: string;

    @ApiProperty({ description: 'File ID' })
    @Column({ type: 'uuid' })
    fileId: string;

    @ApiProperty({ description: 'Type of file', examples: ['id_photo', 'medical_record', 'prescription', 'lab_result'] })
    @Column({ type: 'varchar' })
    fileType: string;

    @ApiProperty({ description: 'Whether this is the primary file for this type' })
    @Column({ type: 'boolean', default: false })
    isPrimary: boolean;

    @ApiProperty({ description: 'When the relationship was created' })
    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @ManyToOne(() => File, file => file.patientFiles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'fileId' })
    file: File;
}
