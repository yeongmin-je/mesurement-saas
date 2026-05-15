import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @Matches(/^01[0-9]-?\d{3,4}-?\d{4}$/, { message: '휴대폰 번호 형식이 올바르지 않습니다' })
  phone!: string;

  @IsString()
  @MinLength(2)
  tenantName!: string;
}
