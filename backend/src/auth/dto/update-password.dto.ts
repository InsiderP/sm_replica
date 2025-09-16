import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({ example: 'OldPassword123', description: 'Current password' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: 'NewPassword456', description: 'New password (min 6 chars)' })
  @IsString()
  @MinLength(6)
  newPassword: string;
} 