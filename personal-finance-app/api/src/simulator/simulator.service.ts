import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { Account } from '../accounts/account.entity';
import { ChallengeConfig } from '../challenge/challenge-config.entity';
import { Goal } from '../goals/goal.entity';
import { Debt } from '../debts/debt.entity';
import { WishlistItem } from '../wishlist/wishlist-item.entity';
import { computeHistoryStats, SimulatorStats } from './history.stats';
import { runSimulation, SimulationResult } from './simulation.engine';
import { SimulatorAiService, InterpretResult, ReportResult } from './simulator-ai.service';
import { InterpretDto, ReportDto, SimulatorRunDto } from './simulator.dto';

@Injectable()
export class SimulatorService {
  constructor(
    @InjectRepository(Transaction)
    private readonly tx: Repository<Transaction>,
    @InjectRepository(Account)
    private readonly acc: Repository<Account>,
    @InjectRepository(ChallengeConfig)
    private readonly chall: Repository<ChallengeConfig>,
    @InjectRepository(Goal)
    private readonly goals: Repository<Goal>,
    @InjectRepository(Debt)
    private readonly debts: Repository<Debt>,
    @InjectRepository(WishlistItem)
    private readonly wishlist: Repository<WishlistItem>,
    private readonly ai: SimulatorAiService
  ) {}

  async getStats(userId: string): Promise<SimulatorStats> {
    const [transactions, accounts, challenge, goals, debts, wishlist] = await Promise.all([
      this.tx.find({ where: { userId } }),
      this.acc.find({ where: { userId } }),
      this.chall.findOne({ where: { userId } }),
      this.goals.find({ where: { userId } }),
      this.debts.find({ where: { userId } }),
      this.wishlist.find({ where: { userId } }),
    ]);
    return computeHistoryStats({ transactions, accounts, challenge, goals, debts, wishlist });
  }

  async run(userId: string, dto: SimulatorRunDto): Promise<SimulationResult> {
    const stats = await this.getStats(userId);
    return runSimulation(stats, dto);
  }

  async interpret(userId: string, dto: InterpretDto): Promise<InterpretResult> {
    const stats = await this.getStats(userId);
    return this.ai.interpret(dto.text, dto.scenario ?? {}, stats);
  }

  async report(userId: string, dto: ReportDto): Promise<ReportResult> {
    const stats = await this.getStats(userId);
    const result = runSimulation(stats, dto);
    return this.ai.report(stats, result, dto.scenario ?? {});
  }
}