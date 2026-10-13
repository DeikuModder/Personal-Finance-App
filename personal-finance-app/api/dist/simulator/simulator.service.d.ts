import { Repository } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { Account } from '../accounts/account.entity';
import { ChallengeConfig } from '../challenge/challenge-config.entity';
import { Goal } from '../goals/goal.entity';
import { Debt } from '../debts/debt.entity';
import { WishlistItem } from '../wishlist/wishlist-item.entity';
import { SimulatorStats } from './history.stats';
import { SimulationResult } from './simulation.engine';
import { SimulatorAiService, InterpretResult, ReportResult } from './simulator-ai.service';
import { InterpretDto, ReportDto, SimulatorRunDto } from './simulator.dto';
export declare class SimulatorService {
    private readonly tx;
    private readonly acc;
    private readonly chall;
    private readonly goals;
    private readonly debts;
    private readonly wishlist;
    private readonly ai;
    constructor(tx: Repository<Transaction>, acc: Repository<Account>, chall: Repository<ChallengeConfig>, goals: Repository<Goal>, debts: Repository<Debt>, wishlist: Repository<WishlistItem>, ai: SimulatorAiService);
    getStats(userId: string): Promise<SimulatorStats>;
    run(userId: string, dto: SimulatorRunDto): Promise<SimulationResult>;
    interpret(userId: string, dto: InterpretDto): Promise<InterpretResult>;
    report(userId: string, dto: ReportDto): Promise<ReportResult>;
}
