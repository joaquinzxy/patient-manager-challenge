import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token',
    example: 'abcd1234...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class VerifyEmailQueryDto {
  @ApiProperty({
    description: 'Email verification token',
    example: '9211b4540174567faf8b4839dae20579691081a4b6b48ef911416f5a557d5582',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResendVerificationDto {
  @ApiProperty({
    description: 'Email address to resend verification to',
    example: 'patient@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
