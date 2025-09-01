import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Nice post yet!!!!!' })
  @IsString()
  text: string;

  @ApiProperty({ example: 'parent-comment-uuid', required: false })
  @IsOptional()
  @IsString()
  parent_comment_id?: string;
} 