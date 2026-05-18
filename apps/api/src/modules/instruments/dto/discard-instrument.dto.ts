import { IsString, MinLength } from 'class-validator';

export class DiscardInstrumentDto {
  @IsString()
  @MinLength(2)
  reason!: string;
}
