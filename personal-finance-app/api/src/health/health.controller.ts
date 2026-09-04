import { Controller, Get } from '@nestjs/common';
import { SkipCfAuth } from '../auth/auth.decorators';

@SkipCfAuth()
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
