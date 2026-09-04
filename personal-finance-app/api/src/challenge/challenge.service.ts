import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChallengeConfig } from './challenge-config.entity';
import { PutChallengeConfigDto } from './challenge-config.dto';

@Injectable()
export class ChallengeService {
  constructor(
    @InjectRepository(ChallengeConfig)
    private readonly repo: Repository<ChallengeConfig>
  ) {}

  async get(userId: string): Promise<ChallengeConfig | null> {
    return this.repo.findOne({ where: { userId } });
  }

  async put(userId: string, dto: PutChallengeConfigDto): Promise<ChallengeConfig> {
    const existing = await this.get(userId);
    const entity = this.repo.create({
      id: existing?.id,
      userId,
      monthlyIncome: dto.monthlyIncome,
      weeklyMax: dto.weeklyMax,
      enabled: dto.enabled,
      createdAt: existing?.createdAt ?? dto.createdAt ?? new Date().toISOString(),
    });
    return this.repo.save(entity);
  }
}
