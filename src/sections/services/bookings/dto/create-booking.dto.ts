import { IsNotEmpty, IsOptional, IsString, Matches, IsNumber, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  catalogItemId: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  date: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'La hora debe tener formato HH:MM' })
  startTime: string;

  @IsOptional()
  @IsNumber()
  @Min(5)
  durationMin?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
