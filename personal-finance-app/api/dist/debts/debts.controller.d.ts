import { AuthenticatedRequest } from '../auth/cf-access.guard';
import { DebtsService } from './debts.service';
import { UpsertDebtDto } from './debt.dto';
export declare class DebtsController {
    private readonly debtsService;
    constructor(debtsService: DebtsService);
    getAll(req: AuthenticatedRequest): Promise<import("./debt.entity").Debt[]>;
    upsert(req: AuthenticatedRequest, dto: UpsertDebtDto): Promise<import("./debt.entity").Debt>;
    remove(req: AuthenticatedRequest, id: string): Promise<{
        success: boolean;
    }>;
}
