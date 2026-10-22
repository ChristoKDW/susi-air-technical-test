import { Injectable } from '@nestjs/common';
import { DataStoreService } from '../data/data-store.service';
import { FIXED_TODAY } from '../common/constants/app.constants';
import { pad2 } from '../common/utils/date.util';

@Injectable()
export class SchedulesService {
  constructor(private readonly dataStoreService: DataStoreService) {}

  getSchedules(year: string, month: string) {
    const paddedMonth = pad2(month);
    const datePrefix = `${year}-${paddedMonth}`;

    const allSchedules = this.dataStoreService.getSchedules();
    const filtered = allSchedules.filter((s) => s.duty_date.startsWith(datePrefix));

    return {
      year,
      month: paddedMonth,
      today: FIXED_TODAY,
      count: filtered.length,
      legend: this.dataStoreService.getLegend(),
      fieldGuide: this.dataStoreService.getFieldGuide(),
      schedules: filtered,
    };
  }
}
