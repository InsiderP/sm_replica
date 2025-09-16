import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({ example: 28.6139 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 77.209 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_available?: boolean;
}


