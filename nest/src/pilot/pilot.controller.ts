import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PilotService } from './pilot.service';

@Controller('pilot')
export class PilotController {
  constructor(private readonly pilotService: PilotService) {}

  @Get('me')
  getMe(@Req() req: Request) {
    const user = req['user'];
    return this.pilotService.getProfile(user);
  }
}
