import { Injectable } from '@nestjs/common';
import { DataStoreService } from '../data/data-store.service';
import { HARDCODED_PILOT } from '../common/constants/app.constants';

@Injectable()
export class PilotService {
  constructor(private readonly dataStoreService: DataStoreService) {}

  getProfile(currentUser?: any) {
    const pilotData = this.dataStoreService.getPilot();
    return {
      username: currentUser?.username || HARDCODED_PILOT.username,
      name: pilotData.name || HARDCODED_PILOT.name,
      totalFlightHours: pilotData.totalFlightHours || HARDCODED_PILOT.totalFlightHours,
      avatarUrl: HARDCODED_PILOT.avatarUrl,
      role: currentUser?.role || HARDCODED_PILOT.role,
    };
  }
}
