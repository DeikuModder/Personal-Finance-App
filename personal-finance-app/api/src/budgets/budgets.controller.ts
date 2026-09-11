import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { BudgetsService } from './budgets.service';
import { UpsertBudgetDto } from './budget.dto';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  async getAll(@Req() req: AuthenticatedRequest) {
    return this.budgetsService.getAll(req.user!.userId);
  }

  @Post()
  async upsert(@Req() req: AuthenticatedRequest, @Body() dto: UpsertBudgetDto) {
    return this.budgetsService.upsert(req.user!.userId, dto);
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.budgetsService.remove(req.user!.userId, id);
    return { success: true };
  }
}
