import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { AccountsService } from './accounts.service';
import { UpsertAccountDto } from './account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async getAll(@Req() req: AuthenticatedRequest) {
    return this.accountsService.getAll(req.user!.userId);
  }

  @Post()
  async upsert(@Req() req: AuthenticatedRequest, @Body() dto: UpsertAccountDto) {
    return this.accountsService.upsert(req.user!.userId, dto);
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.accountsService.remove(req.user!.userId, id);
    return { success: true };
  }
}
