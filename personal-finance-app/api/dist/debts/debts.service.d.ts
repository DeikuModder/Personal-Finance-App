import { Repository } from 'typeorm';
import { Debt } from './debt.entity';
import { UpsertDebtDto } from './debt.dto';
export declare class DebtsService {
    private readonly repo;
    constructor(repo: Repository<Debt>);
    getAll(userId: string): Promise<Debt[]>;
    upsert(userId: string, dto: UpsertDebtDto): Promise<Debt>;
    remove(userId: string, id: string): Promise<void>;
}
