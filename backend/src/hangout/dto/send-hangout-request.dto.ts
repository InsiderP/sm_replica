import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class SendHangoutRequestDto {
  @ApiProperty({ example: 'uuid-of-target-user' })
  @IsUUID()
  to_profile_id: string;

  @ApiProperty({ example: 'Hey! Want to grab coffee?', required: false })
  @IsOptional()
  @IsString()
  message?: string;
}
