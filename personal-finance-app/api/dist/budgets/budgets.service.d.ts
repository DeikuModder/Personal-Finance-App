import { Repository } from 'typeorm';
import { Budget } from './budget.entity';
import { UpsertBudgetDto } from './budget.dto';
export declare class BudgetsService {
    private readonly repo;
    constructor(repo: Repository<Budget>);
    getAll(userId: string): Promise<Budget[]>;
    upsert(userId: string, dto: UpsertBudgetDto): Promise<Budget>;
    remove(userId: string, id: string): Promise<void>;
}
