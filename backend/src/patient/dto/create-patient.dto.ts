import { IsString, IsEmail, IsNotEmpty, Length, Matches, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientDto {
  @ApiProperty({
    description: 'Patient full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 255, { message: 'Name must be between 2 and 255 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Patient email address',
    example: 'john.doe@example.com'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  @Length(5, 255, { message: 'Email must be between 5 and 255 characters' })
  email: string;

  @ApiProperty({
    description: 'Patient phone number',
    example: '+1234567890'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, { 
    message: 'Phone number must be a valid international format' 
  })
  @Transform(({ value }) => value?.trim())
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Patient profile image',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  image?: any;
}
