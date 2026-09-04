import { Repository } from 'typeorm';
import { Account } from './account.entity';
import { UpsertAccountDto } from './account.dto';
export declare class AccountsService {
    private readonly repo;
    constructor(repo: Repository<Account>);
    getAll(userId: string): Promise<Account[]>;
    upsert(userId: string, dto: UpsertAccountDto): Promise<Account>;
    remove(userId: string, id: string): Promise<void>;
}
