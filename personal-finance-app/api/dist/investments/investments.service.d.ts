import { Repository } from 'typeorm';
import { Investment } from './investment.entity';
import { UpsertInvestmentDto } from './investment.dto';
export declare class InvestmentsService {
    private readonly repo;
    constructor(repo: Repository<Investment>);
    getAll(userId: string): Promise<Investment[]>;
    upsert(userId: string, dto: UpsertInvestmentDto): Promise<Investment>;
    remove(userId: string, id: string): Promise<void>;
}
