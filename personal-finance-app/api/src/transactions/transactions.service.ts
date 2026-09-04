import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { UpsertTransactionDto } from './transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly repo: Repository<Transaction>
  ) {}

  async getAll(userId: string): Promise<Transaction[]> {
    return this.repo.find({ where: { userId }, order: { date: 'DESC' } });
  }

  async upsert(userId: string, dto: UpsertTransactionDto): Promise<Transaction> {
    const existing = await this.repo.findOne({ where: { id: dto.id, userId } });
    const entity = this.repo.create({
      ...dto,
      userId,
      createdAt: existing?.createdAt ?? dto.createdAt ?? new Date().toISOString(),
      updatedAt: dto.updatedAt ?? new Date().toISOString(),
      accountId: dto.accountId ?? '',
    });
    return this.repo.save(entity);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundException('Transaction not found');
    }
    await this.repo.remove(existing);
  }
}
