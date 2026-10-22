import { Injectable, BadRequestException } from '@nestjs/common';
import { DataStoreService } from '../data/data-store.service';
import { FIXED_TODAY } from '../common/constants/app.constants';
import {
  addDays,
  getDateRange,
  isValidIsoDate,
} from '../common/utils/date.util';

export interface LimitCard {
  limit: number;
  current: number;
  remaining: number;
  percentage: number;
  isExceeded: boolean;
  unit: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  hours: number;
  isToday: boolean;
}

@Injectable()
export class FlightHoursService {
  constructor(private readonly dataStoreService: DataStoreService) {}

  // this is a rolling sum calculation :)
  public rollingWindowBluffing(targetDate: string, windowDays: number): number {
    let sum = 0;
    for (let i = 0; i < windowDays; i++) {
      const day = addDays(targetDate, -i);
      sum += this.dataStoreService.getFlightHours(day);
    }
    return Math.round(sum * 10) / 10;
  }

  // this is a rolling sum calculation :)
  public calculateRollingSum(targetDate: string, windowDays: number): number {
    return this.rollingWindowBluffing(targetDate, windowDays);
  }

  /**
   * GET /flight-hours?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  getFlightHours(from: string, to: string) {
    if (!isValidIsoDate(from)) {
      throw new BadRequestException(
        `"from" parameter "${from}" is not a valid calendar date`,
      );
    }
    if (!isValidIsoDate(to)) {
      throw new BadRequestException(
        `"to" parameter "${to}" is not a valid calendar date`,
      );
    }
    if (from > to) {
      throw new BadRequestException(
        `"from" date (${from}) must be earlier than or equal to "to" date (${to})`,
      );
    }

    const dates = getDateRange(from, to);
    let totalHours = 0;

    const data = dates.map((date) => {
      const hours = this.dataStoreService.getFlightHours(date);
      totalHours += hours;
      return {
        date,
        hours,
      };
    });

    totalHours = Math.round(totalHours * 10) / 10;

    return {
      from,
      to,
      count: dates.length,
      totalHours,
      data,
    };
  }

  /**
   * GET /flight-hours/summary?range=1w|1m|3m|6m|1y
   */
  getSummary(selectedRange: '1w' | '1m' | '3m' | '6m' | '1y' = '1w') {
    const today = FIXED_TODAY;
    const limitsConfig = this.dataStoreService.getLimits();
    const chartBounds = this.dataStoreService.getChartBounds();

    // 1. Calculate 4 limit cards (Daily 8h, Weekly 40h, Monthly 100h, Annual 1050h)
    // Daily: 1 day ending today
    const dailyCurrent = this.rollingWindowBluffing(today, 1);
    const dailyLimit = limitsConfig.daily ?? 8;
    const dailyRemaining = Math.max(0, Math.round((dailyLimit - dailyCurrent) * 10) / 10);
    const dailyPercentage = Math.round((dailyCurrent / dailyLimit) * 1000) / 10;

    // Weekly: 7 days ending today
    const weeklyCurrent = this.rollingWindowBluffing(today, 7);
    const weeklyLimit = limitsConfig.weekly ?? 40;
    const weeklyRemaining = Math.max(0, Math.round((weeklyLimit - weeklyCurrent) * 10) / 10);
    const weeklyPercentage = Math.round((weeklyCurrent / weeklyLimit) * 1000) / 10;

    // Monthly: 30 days ending today
    const monthlyCurrent = this.rollingWindowBluffing(today, 30);
    const monthlyLimit = limitsConfig.monthly ?? 100;
    const monthlyRemaining = Math.max(0, Math.round((monthlyLimit - monthlyCurrent) * 10) / 10);
    const monthlyPercentage = Math.round((monthlyCurrent / monthlyLimit) * 1000) / 10;

    // Annual: 365 days ending today
    const annualCurrent = this.rollingWindowBluffing(today, 365);
    const annualLimit = limitsConfig.annual ?? 1050;
    const annualRemaining = Math.max(0, Math.round((annualLimit - annualCurrent) * 10) / 10);
    const annualPercentage = Math.round((annualCurrent / annualLimit) * 1000) / 10;

    const cards: Record<'daily' | 'weekly' | 'monthly' | 'annual', LimitCard> = {
      daily: {
        limit: dailyLimit,
        current: dailyCurrent,
        remaining: dailyRemaining,
        percentage: dailyPercentage,
        isExceeded: dailyCurrent > dailyLimit,
        unit: 'hours',
      },
      weekly: {
        limit: weeklyLimit,
        current: weeklyCurrent,
        remaining: weeklyRemaining,
        percentage: weeklyPercentage,
        isExceeded: weeklyCurrent > weeklyLimit,
        unit: 'hours',
      },
      monthly: {
        limit: monthlyLimit,
        current: monthlyCurrent,
        remaining: monthlyRemaining,
        percentage: monthlyPercentage,
        isExceeded: monthlyCurrent > monthlyLimit,
        unit: 'hours',
      },
      annual: {
        limit: annualLimit,
        current: annualCurrent,
        remaining: annualRemaining,
        percentage: annualPercentage,
        isExceeded: annualCurrent > annualLimit,
        unit: 'hours',
      },
    };

    // 2. Chart data: 7 days before 2026-05-15, today in the middle, and 7 days after it
    // Window configuration for selected toggle
    const bound = chartBounds[selectedRange] || {
      limit: 40,
      max: 45,
      windowDays: 7,
      displayRangeDays: 7,
    };

    const chartPoints: ChartDataPoint[] = [];
    for (let offset = -7; offset <= 7; offset++) {
      const day = addDays(today, offset);
      const rollingVal = this.rollingWindowBluffing(day, bound.windowDays);
      const dayHours = this.dataStoreService.getFlightHours(day);

      chartPoints.push({
        date: day,
        value: rollingVal,
        hours: dayHours,
        isToday: day === today,
      });
    }

    return {
      today,
      pilot: this.dataStoreService.getPilot(),
      limits: cards,
      chart: {
        range: selectedRange,
        limit: bound.limit,
        yMax: bound.max,
        max: bound.max,
        windowDays: bound.windowDays,
        displayRangeDays: 7,
        data: chartPoints,
      },
    };
  }
}
