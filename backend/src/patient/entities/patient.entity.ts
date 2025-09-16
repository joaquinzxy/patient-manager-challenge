import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { OneToMany } from 'typeorm';
import { EmailVerificationToken } from '../../auth/entities/email-verification-token.entity';
import { PatientFile } from '../../files/entities/patient-file.entity';

@Entity('patients')
@Index(['email'], { unique: true })
@Index(['isDeleted'])
export class Patient {
    @ApiProperty({ description: 'Unique identifier for the patient' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ description: 'Full name of the patient', maxLength: 255 })
    @Column({ type: 'varchar', length: 255 })
    name: string;

    @ApiProperty({ description: 'Email address of the patient', maxLength: 255 })
    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @ApiProperty({ description: 'Phone number of the patient', maxLength: 20 })
    @Column({ type: 'varchar', length: 20 })
    phoneNumber: string;

    @ApiProperty({ description: 'Indicates if the patient email has been verified', default: false })
    @Column({ default: false })
    isEmailVerified: boolean;

    @OneToMany(() => EmailVerificationToken, token => token.patient)
    verificationTokens: EmailVerificationToken[];

    @OneToMany(() => PatientFile, patientFile => patientFile.patient)
    patientFiles: PatientFile[];

    @ApiProperty({ description: 'Timestamp when the patient was added' })
    @CreateDateColumn({ type: 'timestamp' })
    addedAt: Date;

    @ApiProperty({ description: 'Timestamp when the patient was last updated' })
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @ApiProperty({ description: 'Indicates if the patient has been logically deleted', default: false })
    @Column({ type: 'boolean', default: false })
    isDeleted: boolean;

    @ApiProperty({ description: 'File ID of the patient document photo', nullable: true })
    @Column({ type: 'uuid', nullable: true })
    documentFileId: string | null;
}
