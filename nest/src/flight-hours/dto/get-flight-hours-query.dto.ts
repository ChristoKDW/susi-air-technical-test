import { IsNotEmpty, Matches } from 'class-validator';

export class GetFlightHoursQueryDto {
  @IsNotEmpty({ message: '"from" parameter is required' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: '"from" parameter must be in YYYY-MM-DD format',
  })
  from: string;

  @IsNotEmpty({ message: '"to" parameter is required' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: '"to" parameter must be in YYYY-MM-DD format',
  })
  to: string;
}
