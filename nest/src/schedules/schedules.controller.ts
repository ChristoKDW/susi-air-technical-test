import { Controller, Get, Query } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { GetSchedulesQueryDto } from './dto/get-schedules-query.dto';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  getSchedules(@Query() query: GetSchedulesQueryDto) {
    return this.schedulesService.getSchedules(query.year, query.month);
  }
}
