import { Repository } from 'typeorm';
import { BudgetItem } from './budget-item.entity';
import { UpsertBudgetItemDto } from './budget-item.dto';
export declare class BudgetItemsService {
    private readonly repo;
    constructor(repo: Repository<BudgetItem>);
    getAll(userId: string): Promise<BudgetItem[]>;
    upsert(userId: string, dto: UpsertBudgetItemDto): Promise<BudgetItem>;
    remove(userId: string, id: string): Promise<void>;
}
