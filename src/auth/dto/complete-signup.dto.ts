import { IsString, IsEmail, Matches, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteSignupDto {
  @ApiProperty({ example: '+919876543210', description: 'Indian phone number with country code' })
  @IsString()
  @Matches(/^\+91[6-9]\d{9}$/, { message: 'Phone must be a valid Indian number starting with +91' })
  phone: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'male', description: 'Gender (male/female/other)' })
  @IsString()
  gender: string;

  @ApiProperty({ example: 'john_doe', description: 'Unique username' })
  @IsString()
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  userName: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'Profile avatar URL' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;


  @ApiProperty({ example: true, description: 'Is the user account public?', required: false, default: true })
  @IsOptional()
  is_public?: boolean = true;
} 