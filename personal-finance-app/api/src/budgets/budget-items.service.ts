import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetItem } from './budget-item.entity';
import { UpsertBudgetItemDto } from './budget-item.dto';

@Injectable()
export class BudgetItemsService {
  constructor(
    @InjectRepository(BudgetItem)
    private readonly repo: Repository<BudgetItem>
  ) {}

  async getAll(userId: string): Promise<BudgetItem[]> {
    return this.repo.find({ where: { userId } });
  }

  async upsert(userId: string, dto: UpsertBudgetItemDto): Promise<BudgetItem> {
    const existing = await this.repo.findOne({
      where: { id: dto.id, userId, budgetId: dto.budgetId },
    });
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
      throw new NotFoundException('Budget item not found');
    }
    await this.repo.remove(existing);
  }
}