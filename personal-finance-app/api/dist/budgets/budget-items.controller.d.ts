import { AuthenticatedRequest } from '../auth/cf-access.guard';
import { BudgetItemsService } from './budget-items.service';
import { UpsertBudgetItemDto } from './budget-item.dto';
export declare class BudgetItemsController {
    private readonly budgetItemsService;
    constructor(budgetItemsService: BudgetItemsService);
    getAll(req: AuthenticatedRequest): Promise<import("./budget-item.entity").BudgetItem[]>;
    upsert(req: AuthenticatedRequest, dto: UpsertBudgetItemDto): Promise<import("./budget-item.entity").BudgetItem>;
    remove(req: AuthenticatedRequest, id: string): Promise<{
        success: boolean;
    }>;
}
