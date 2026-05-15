import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export class CreateUploadUrlDto {
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType!: string;

  @IsOptional()
  @IsUUID()
  instrumentId?: string;
}
