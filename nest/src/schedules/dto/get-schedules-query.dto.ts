import { IsNotEmpty, Matches } from 'class-validator';

export class GetSchedulesQueryDto {
  @IsNotEmpty({ message: 'year is required' })
  @Matches(/^\d{4}$/, {
    message: 'year must be a 4-digit number (e.g. 2026)',
  })
  year: string;

  @IsNotEmpty({ message: 'month is required' })
  @Matches(/^(0?[1-9]|1[0-2])$/, {
    message: 'month must be between 1 and 12 (e.g. 05 or 5)',
  })
  month: string;
}
