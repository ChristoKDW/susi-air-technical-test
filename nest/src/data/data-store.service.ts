import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface PilotInfo {
  name: string;
  totalFlightHours: number;
}

export interface LimitsConfig {
  daily: number;
  weekly: number;
  monthly: number;
  annual: number;
}

export interface ChartBoundItem {
  limit: number;
  max: number;
  windowDays: number;
  displayRangeDays: number;
}

export interface FlightHourEntry {
  date: string;
  hours: number;
}

export interface DocumentItem {
  id: string;
  label: string;
  expiryDate: string;
}

export interface ScheduleItem {
  id: string;
  duty_date: string;
  status: number;
  base_name: string;
  base_color: string;
  duty_type: string;
  count_schedules: number;
  count_logbooks: number;
}

export interface ScheduleLegendItem {
  code: string;
  label: string;
  color: string;
}

@Injectable()
export class DataStoreService implements OnModuleInit {
  private readonly logger = new Logger(DataStoreService.name);

  // In-memory data holders
  private pilot: PilotInfo = { name: 'John Doe', totalFlightHours: 0 };
  private limits: LimitsConfig = { daily: 8, weekly: 40, monthly: 100, annual: 1050 };
  private chartBounds: Record<string, ChartBoundItem> = {};
  private flightHours: FlightHourEntry[] = [];
  private flightHoursMap = new Map<string, number>();

  private documents: DocumentItem[] = [];
  private warningDays = 30;

  private schedules: ScheduleItem[] = [];
  private scheduleLegend: ScheduleLegendItem[] = [];
  private fieldGuide: Record<string, string> = {};

  onModuleInit() {
    this.loadAllData();
  }

  private resolveFilePath(filename: string): string {
    const candidates = [
      path.resolve(process.cwd(), 'data', filename),
      path.resolve(process.cwd(), 'nest/data', filename),
      path.resolve(process.cwd(), 'data-source', filename),
      path.resolve(process.cwd(), '../data-source', filename),
      path.resolve(__dirname, '../data', filename),
      path.resolve(__dirname, '../../data', filename),
      path.resolve(__dirname, '../../../data', filename),
      path.resolve(__dirname, '../../../data-source', filename),
      path.resolve('/var/task/nest/data', filename),
      path.resolve('/var/task/data', filename),
      path.resolve(process.cwd(), filename),
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        return cand;
      }
    }

    throw new Error(
      `Could not locate ${filename} in candidates:\n${candidates.join('\n')}`,
    );
  }

  private loadAllData() {
    this.logger.log('Loading mock JSON datasets into memory...');

    // 1. Load flight hours
    const flightHoursPath = this.resolveFilePath('mock-flight-hours.json');
    const flightHoursRaw = fs.readFileSync(flightHoursPath, 'utf8');
    const flightHoursJson = JSON.parse(flightHoursRaw);

    this.pilot = flightHoursJson.pilot;
    this.limits = flightHoursJson.limits;
    this.chartBounds = flightHoursJson.chartBounds;
    this.flightHours = flightHoursJson.flightHours || [];

    this.flightHoursMap.clear();
    for (const entry of this.flightHours) {
      this.flightHoursMap.set(entry.date, Number(entry.hours));
    }

    // 2. Load documents
    const documentsPath = this.resolveFilePath('mock-documents.json');
    const documentsRaw = fs.readFileSync(documentsPath, 'utf8');
    const documentsJson = JSON.parse(documentsRaw);

    this.documents = documentsJson.documents || [];
    if (documentsJson.thresholds?.warningDays !== undefined) {
      this.warningDays = documentsJson.thresholds.warningDays;
    }

    // 3. Load schedules
    const schedulesPath = this.resolveFilePath('mock-schedules.json');
    const schedulesRaw = fs.readFileSync(schedulesPath, 'utf8');
    const schedulesJson = JSON.parse(schedulesRaw);

    this.schedules = schedulesJson.schedules || [];
    this.scheduleLegend = schedulesJson.legend || [];
    this.fieldGuide = schedulesJson.fieldGuide || {};

    this.logger.log(
      `[Startup] Successfully loaded into memory: ` +
        `${this.flightHours.length} flight hour records, ` +
        `${this.documents.length} documents, ` +
        `${this.schedules.length} schedules.`,
    );
  }

  // Pilot getters
  getPilot(): PilotInfo {
    return { ...this.pilot };
  }

  // Limits & Chart getters
  getLimits(): LimitsConfig {
    return { ...this.limits };
  }

  getChartBounds(): Record<string, ChartBoundItem> {
    return { ...this.chartBounds };
  }

  // Flight hours accessors
  getFlightHours(date: string): number {
    return this.flightHoursMap.get(date) ?? 0.0;
  }

  getAllFlightHours(): FlightHourEntry[] {
    return [...this.flightHours];
  }

  hasFlightHour(date: string): boolean {
    return this.flightHoursMap.has(date);
  }

  // Documents accessors
  getDocuments(): DocumentItem[] {
    return [...this.documents];
  }

  getWarningDays(): number {
    return this.warningDays;
  }

  // Schedules accessors
  getSchedules(): ScheduleItem[] {
    return [...this.schedules];
  }

  getLegend(): ScheduleLegendItem[] {
    return [...this.scheduleLegend];
  }

  getFieldGuide(): Record<string, string> {
    return { ...this.fieldGuide };
  }
}
