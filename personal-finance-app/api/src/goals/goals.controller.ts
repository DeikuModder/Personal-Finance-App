import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/cf-access.guard';
import { GoalsService } from './goals.service';
import { UpsertGoalDto } from './goal.dto';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  async getAll(@Req() req: AuthenticatedRequest) {
    return this.goalsService.getAll(req.user!.userId);
  }

  @Post()
  async upsert(@Req() req: AuthenticatedRequest, @Body() dto: UpsertGoalDto) {
    return this.goalsService.upsert(req.user!.userId, dto);
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.goalsService.remove(req.user!.userId, id);
    return { success: true };
  }
}