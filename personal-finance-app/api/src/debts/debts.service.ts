import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Debt } from './debt.entity';
import { UpsertDebtDto } from './debt.dto';

@Injectable()
export class DebtsService {
  constructor(
    @InjectRepository(Debt)
    private readonly repo: Repository<Debt>
  ) {}

  async getAll(userId: string): Promise<Debt[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  async upsert(userId: string, dto: UpsertDebtDto): Promise<Debt> {
    const existing = await this.repo.findOne({ where: { id: dto.id, userId } });
    const entity = this.repo.create({
      ...dto,
      userId,
      status: dto.status ?? 'active',
      description: dto.description ?? null,
      interestRate: dto.interestRate ?? 0,
      minimumPayment: dto.minimumPayment ?? 0,
      dueDate: dto.dueDate ?? null,
      remindOn: dto.remindOn ?? null,
      paidAt: dto.status === 'paid' ? dto.paidAt ?? new Date().toISOString().split('T')[0] : null,
      createdAt: existing?.createdAt ?? dto.createdAt ?? new Date().toISOString(),
    });
    return this.repo.save(entity);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundException('Debt not found');
    }
    await this.repo.remove(existing);
  }
}