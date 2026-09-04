import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { UpsertTransactionDto } from './transaction.dto';
export declare class TransactionsService {
    private readonly repo;
    constructor(repo: Repository<Transaction>);
    getAll(userId: string): Promise<Transaction[]>;
    upsert(userId: string, dto: UpsertTransactionDto): Promise<Transaction>;
    remove(userId: string, id: string): Promise<void>;
}
