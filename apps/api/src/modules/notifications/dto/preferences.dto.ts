import { IsBoolean, IsOptional, Matches } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional() @IsBoolean() pushEnabled?: boolean;
  @IsOptional() @IsBoolean() kakaoEnabled?: boolean;
  @IsOptional() @IsBoolean() smsEnabled?: boolean;
  @IsOptional() @IsBoolean() emailEnabled?: boolean;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'HH:MM 형식이어야 합니다' })
  quietHoursStart?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'HH:MM 형식이어야 합니다' })
  quietHoursEnd?: string;
}
