import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Investment } from './investment.entity';
import { UpsertInvestmentDto } from './investment.dto';

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectRepository(Investment)
    private readonly repo: Repository<Investment>
  ) {}

  async getAll(userId: string): Promise<Investment[]> {
    return this.repo.find({ where: { userId } });
  }

  async upsert(userId: string, dto: UpsertInvestmentDto): Promise<Investment> {
    const existing = await this.repo.findOne({ where: { id: dto.id, userId } });
    const entity = this.repo.create({
      ...dto,
      userId,
      createdAt: existing?.createdAt ?? dto.createdAt ?? new Date().toISOString(),
      lastUpdated: dto.lastUpdated ?? '',
      symbol: dto.symbol ?? null,
      shares: dto.shares ?? null,
      dividendPerShare: dto.dividendPerShare ?? null,
    });
    return this.repo.save(entity);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundException('Investment not found');
    }
    await this.repo.remove(existing);
  }
}
