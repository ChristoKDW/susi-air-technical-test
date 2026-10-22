import { Controller, Get, Query } from '@nestjs/common';
import { FlightHoursService } from './flight-hours.service';
import { GetFlightHoursQueryDto } from './dto/get-flight-hours-query.dto';
import { GetFlightHoursSummaryQueryDto } from './dto/get-flight-hours-summary-query.dto';

@Controller('flight-hours')
export class FlightHoursController {
  constructor(private readonly flightHoursService: FlightHoursService) {}

  @Get('summary')
  getSummary(@Query() query: GetFlightHoursSummaryQueryDto) {
    return this.flightHoursService.getSummary(query.range || '1w');
  }

  @Get()
  getFlightHours(@Query() query: GetFlightHoursQueryDto) {
    return this.flightHoursService.getFlightHours(query.from, query.to);
  }
}
