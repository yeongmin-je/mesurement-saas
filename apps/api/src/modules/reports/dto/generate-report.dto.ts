import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class ReportParametersDto {
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) departmentIds?: string[];

  // Department report
  @IsOptional() @IsUUID() departmentId?: string;

  // Monthly report
  @IsOptional() @IsInt() @Min(2000) @Max(2100) year?: number;
  @IsOptional() @IsInt() @Min(1) @Max(12) month?: number;
}

export class GenerateReportDto {
  @IsEnum(['iso9001', 'department', 'monthly'])
  type!: 'iso9001' | 'department' | 'monthly';

  @ValidateNested()
  @Type(() => ReportParametersDto)
  parameters!: ReportParametersDto;
}
