import { IsString, IsOptional, Matches, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'john_doe', description: 'Unique username' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  userName?: string;

  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'My bio', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'male', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ example: 'https://example.com/avatar.png', required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ example: '2000-01-01', required: false, type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;
} 