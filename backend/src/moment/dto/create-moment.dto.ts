import { IsOptional, IsString, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateMomentDto {
  @ApiProperty({ type: [String], required: false, description: 'Captions for each media file (optional)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return [];
    if (Array.isArray(value)) return value;
    // If comma-separated string, split
    if (typeof value === 'string' && value.includes(',')) return value.split(',').map(v => v.trim());
    // If single string, wrap in array
    return [value];
  })
  captions?: string[];

  @ApiProperty({ type: [Number], required: false, description: 'Order for each media file (optional, 0-based)' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return [];
    if (Array.isArray(value)) return value.map(Number);
    // If comma-separated string, split and convert to numbers
    if (typeof value === 'string' && value.includes(',')) return value.split(',').map(v => Number(v.trim()));
    // If single string/number, wrap in array and convert to number
    return [Number(value)];
  })
  order?: number[];
} 