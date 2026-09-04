import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './budget.entity';
import { UpsertBudgetDto } from './budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly repo: Repository<Budget>
  ) {}

  async getAll(userId: string): Promise<Budget[]> {
    return this.repo.find({ where: { userId } });
  }

  async upsert(userId: string, dto: UpsertBudgetDto): Promise<Budget> {
    const existing = await this.repo.findOne({ where: { id: dto.id, userId } });
    const entity = this.repo.create({
      ...dto,
      userId,
      createdAt: existing?.createdAt ?? dto.createdAt ?? new Date().toISOString(),
    });
    return this.repo.save(entity);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundException('Budget not found');
    }
    await this.repo.remove(existing);
  }
}
