import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class MediaItemDto {
  @ApiProperty({ example: 'https://your-supabase-url/storage/v1/object/public/supergram/abc.jpg', description: 'Public URL of the media in Supabase Storage' })
  @IsString()
  url: string;

  @ApiProperty({ example: 'image', enum: ['image', 'video'] })
  @IsString()
  type: 'image' | 'video';
}

export class CreatePostDto {
  @ApiProperty({ example: 'My new post' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({ type: [MediaItemDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  media?: MediaItemDto[];

  @ApiProperty({ example: ['user1', 'user2'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return typeof value === 'string' ? [value] : value;
  })
  tagged_usernames?: string[];

  @IsOptional()
  files?: any;
} 