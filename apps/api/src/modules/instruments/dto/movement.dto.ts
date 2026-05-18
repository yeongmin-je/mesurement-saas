import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateMovementDto {
  @IsOptional() @IsUUID() toDepartmentId?: string;
  @IsOptional() @IsString() @MaxLength(200) toLocation?: string;
  @IsOptional() @IsString() reason?: string;
}
