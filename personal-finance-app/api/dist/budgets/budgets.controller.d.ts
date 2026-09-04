import { AuthenticatedRequest } from '../auth/cf-access.guard';
import { BudgetsService } from './budgets.service';
import { UpsertBudgetDto } from './budget.dto';
export declare class BudgetsController {
    private readonly budgetsService;
    constructor(budgetsService: BudgetsService);
    getAll(req: AuthenticatedRequest): Promise<import("./budget.entity").Budget[]>;
    upsert(req: AuthenticatedRequest, dto: UpsertBudgetDto): Promise<import("./budget.entity").Budget>;
    remove(req: AuthenticatedRequest, id: string): Promise<{
        success: boolean;
    }>;
}
