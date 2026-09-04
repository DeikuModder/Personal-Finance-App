import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/cf-access.guard';
import { ChallengeService } from './challenge.service';
import { PutChallengeConfigDto } from './challenge-config.dto';

@Controller('challenge-config')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Get()
  async get(@Req() req: AuthenticatedRequest) {
    const config = await this.challengeService.get(req.user!.userId);
    return config ?? { monthlyIncome: 0, weeklyMax: 0, enabled: false, createdAt: '' };
  }

  @Put()
  async put(@Req() req: AuthenticatedRequest, @Body() dto: PutChallengeConfigDto) {
    return this.challengeService.put(req.user!.userId, dto);
  }
}
