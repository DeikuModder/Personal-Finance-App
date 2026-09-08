import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/cf-access.guard';
import { BudgetItemsService } from './budget-items.service';
import { UpsertBudgetItemDto } from './budget-item.dto';

@Controller('budget-items')
export class BudgetItemsController {
  constructor(private readonly budgetItemsService: BudgetItemsService) {}

  @Get()
  async getAll(@Req() req: AuthenticatedRequest) {
    return this.budgetItemsService.getAll(req.user!.userId);
  }

  @Post()
  async upsert(@Req() req: AuthenticatedRequest, @Body() dto: UpsertBudgetItemDto) {
    return this.budgetItemsService.upsert(req.user!.userId, dto);
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.budgetItemsService.remove(req.user!.userId, id);
    return { success: true };
  }
}