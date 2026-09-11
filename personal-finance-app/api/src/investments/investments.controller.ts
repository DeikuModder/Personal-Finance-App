import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { InvestmentsService } from './investments.service';
import { UpsertInvestmentDto } from './investment.dto';

@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get()
  async getAll(@Req() req: AuthenticatedRequest) {
    return this.investmentsService.getAll(req.user!.userId);
  }

  @Post()
  async upsert(@Req() req: AuthenticatedRequest, @Body() dto: UpsertInvestmentDto) {
    return this.investmentsService.upsert(req.user!.userId, dto);
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.investmentsService.remove(req.user!.userId, id);
    return { success: true };
  }
}
