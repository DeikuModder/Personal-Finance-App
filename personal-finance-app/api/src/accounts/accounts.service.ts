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
    const { entities, raw } = await this.repo
      .createQueryBuilder('a')
      .leftJoin(
        'transactions',
        't',
        `t.account_id = a.id::text OR (t.type = 'transfer' AND t.source_account_id = a.id::text)`
      )
      .addSelect(
        `COALESCE(SUM(
           CASE
             WHEN t.type = 'income' THEN COALESCE(t.amount, 0)
             WHEN t.type = 'transfer' AND t.account_id = a.id::text THEN COALESCE(t.amount, 0)
             ELSE -COALESCE(t.amount, 0)
           END
         ), 0)::float8`,
        'balance'
      )
      .where('a."userId" = :userId', { userId })
      .groupBy('a.id')
      .addOrderBy('a.created_at', 'ASC')
      .getRawAndEntities();
    return entities.map((entity, i) => ({ ...entity, balance: Number(raw[i].balance) }));
  }

  async upsert(userId: string, dto: UpsertAccountDto): Promise<Account> {
    const existing = await this.repo.findOne({ where: { id: dto.id, userId } });
    const entity = this.repo.create({
      id: dto.id,
      name: dto.name,
      type: dto.type,
      balance: 0,
      userId,
      createdAt: existing?.createdAt ?? dto.createdAt ?? new Date().toISOString(),
      currency: dto.currency ?? 'USD',
      color: dto.color ?? '#ff6e6e',
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