import { AuthenticatedRequest } from '../auth/cf-access.guard';
import { TransactionsService } from './transactions.service';
import { UpsertTransactionDto } from './transaction.dto';
export declare class TransactionsController {
    private readonly transactionsService;
    constructor(transactionsService: TransactionsService);
    getAll(req: AuthenticatedRequest): Promise<import("./transaction.entity").Transaction[]>;
    upsert(req: AuthenticatedRequest, dto: UpsertTransactionDto): Promise<import("./transaction.entity").Transaction>;
    remove(req: AuthenticatedRequest, id: string): Promise<{
        success: boolean;
    }>;
}
