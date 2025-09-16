import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpAndCreateDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;

  @ApiProperty({ example: 'jwt-token-here' })
  @IsString()
  signupToken: string;

  
} 