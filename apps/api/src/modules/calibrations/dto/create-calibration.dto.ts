import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CalibrationPointDto {
  @IsNumber() point!: number;
  @IsNumber() measured!: number;
  @IsNumber() reference!: number;
  @IsNumber() error!: number;
}

export class CreateCalibrationDto {
  @IsDateString() performedAt!: string;

  @IsOptional() @IsUUID() calibrationOrgId?: string;
  @IsOptional() @IsString() @MaxLength(200) calibrationOrgText?: string;
  @IsOptional() @IsString() @MaxLength(100) performedByName?: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CalibrationPointDto)
  asFoundData?: CalibrationPointDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CalibrationPointDto)
  asLeftData?: CalibrationPointDto[];

  @IsOptional() @IsNumber() uncertainty?: number;

  @IsEnum(['pass', 'conditional', 'fail'])
  result!: 'pass' | 'conditional' | 'fail';

  @IsOptional() @IsString() @MaxLength(100) certificateNo?: string;
  @IsOptional() @IsString() @MaxLength(500) certificateS3Key?: string;
  @IsOptional() @IsNumber() cost?: number;
  @IsOptional() @IsString() notes?: string;
}
