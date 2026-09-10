import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from './goal.entity';
import { UpsertGoalDto } from './goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private readonly repo: Repository<Goal>
  ) {}

  async getAll(userId: string): Promise<Goal[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  async upsert(userId: string, dto: UpsertGoalDto): Promise<Goal> {
    const existing = await this.repo.findOne({ where: { id: dto.id, userId } });
    const entity = this.repo.create({
      ...dto,
      userId,
      type: dto.type ?? 'savings',
      title: dto.title,
      icon: dto.icon ?? 'flag',
      targetAmount: dto.targetAmount ?? 0,
      deadline: dto.deadline ?? null,
      picture: dto.picture ?? null,
      category: dto.category ?? null,
      allowance: dto.allowance ?? 0,
      allowancePeriod: dto.allowancePeriod ?? 'day',
      streakTarget: dto.streakTarget ?? null,
      status: dto.status ?? 'active',
      achievedAt: dto.achievedAt ?? null,
      createdAt: existing?.createdAt ?? dto.createdAt ?? new Date().toISOString(),
    });
    return this.repo.save(entity);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundException('Goal not found');
    }
    await this.repo.remove(existing);
  }
}