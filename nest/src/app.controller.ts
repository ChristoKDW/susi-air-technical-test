import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getRoot() {
    return {
      status: 'ok',
      service: 'Susi Air Pilot API',
      version: '1.0.0',
      timestamp: '2026-05-15',
    };
  }
}
