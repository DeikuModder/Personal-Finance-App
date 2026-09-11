import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { UpsertTransactionDto } from './transaction.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getAll(@Req() req: AuthenticatedRequest) {
    return this.transactionsService.getAll(req.user!.userId);
  }

  @Post()
  async upsert(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertTransactionDto
  ) {
    return this.transactionsService.upsert(req.user!.userId, dto);
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.transactionsService.remove(req.user!.userId, id);
    return { success: true };
  }
}
