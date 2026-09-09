import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/cf-access.guard';
import { DebtsService } from './debts.service';
import { UpsertDebtDto } from './debt.dto';

@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Get()
  async getAll(@Req() req: AuthenticatedRequest) {
    return this.debtsService.getAll(req.user!.userId);
  }

  @Post()
  async upsert(@Req() req: AuthenticatedRequest, @Body() dto: UpsertDebtDto) {
    return this.debtsService.upsert(req.user!.userId, dto);
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.debtsService.remove(req.user!.userId, id);
    return { success: true };
  }
}