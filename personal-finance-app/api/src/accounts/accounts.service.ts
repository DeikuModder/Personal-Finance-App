import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './account.entity';
import { UpsertAccountDto } from './account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly repo: Repository<Account>
  ) {}

  async getAll(userId: string): Promise<Account[]> {
    return this.repo.find({ where: { userId } });
  }

  async upsert(userId: string, dto: UpsertAccountDto): Promise<Account> {
    const existing = await this.repo.findOne({ where: { id: dto.id, userId } });
    const entity = this.repo.create({
      ...dto,
      userId,
      createdAt: existing?.createdAt ?? dto.createdAt ?? new Date().toISOString(),
      currency: dto.currency ?? 'USD',
      color: dto.color ?? '#bb86fc',
      icon: dto.icon ?? 'account_balance_wallet',
    });
    return this.repo.save(entity);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundException('Account not found');
    }
    await this.repo.remove(existing);
  }
}
