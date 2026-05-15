import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryInstrumentsDto {
  @IsOptional() @IsString() q?: string;

  @IsOptional()
  @IsEnum(['active', 'calibrating', 'repairing', 'suspended', 'discarded'])
  status?: 'active' | 'calibrating' | 'repairing' | 'suspended' | 'discarded';

  @IsOptional() @IsUUID() departmentId?: string;

  @IsOptional() @Type(() => Number) @IsInt() kolasCategoryId?: number;
  @IsOptional() @Type(() => Number) @IsInt() manufacturerId?: number;

  @IsOptional()
  @IsEnum(['normal', 'imminent', 'overdue'])
  calibrationStatus?: 'normal' | 'imminent' | 'overdue';

  @IsOptional()
  @IsEnum(['recent', 'next_calibration', 'name'])
  sort?: 'recent' | 'next_calibration' | 'name';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number = 20;
}
