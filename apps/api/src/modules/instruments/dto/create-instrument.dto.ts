import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateInstrumentDto {
  @IsOptional() @IsString() @MaxLength(50) assetCode?: string;
  @IsOptional() @IsString() @MaxLength(100) serialNumber?: string;

  @IsOptional() @IsInt() kolasCategoryId?: number;
  @IsOptional() @IsInt() manufacturerId?: number;
  @IsOptional() @IsInt() modelId?: number;

  @IsOptional() @IsString() @MaxLength(100) categoryText?: string;
  @IsOptional() @IsString() @MaxLength(100) manufacturerText?: string;
  @IsOptional() @IsString() @MaxLength(100) modelText?: string;

  @IsOptional() @IsNumber() measureRangeMin?: number;
  @IsOptional() @IsNumber() measureRangeMax?: number;
  @IsOptional() @IsString() @MaxLength(20) measureUnit?: string;
  @IsOptional() @IsString() @MaxLength(50) accuracyClass?: string;

  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsString() @MaxLength(200) location?: string;
  @IsOptional() @IsUUID() custodianId?: string;

  @IsOptional() @IsDateString() acquiredAt?: string;
  @IsOptional() @IsNumber() acquiredCost?: number;

  @IsOptional() @IsInt() @Min(1) cycleMonths?: number;

  @IsOptional() @IsArray() @IsUUID('4', { each: true }) photoIds?: string[];

  @IsOptional() aiRecognition?: Record<string, unknown>;

  @IsOptional() @IsString() notes?: string;
}
