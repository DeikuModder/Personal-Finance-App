import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { AccountsService } from './accounts.service';
import { UpsertAccountDto } from './account.dto';
export declare class AccountsController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    getAll(req: AuthenticatedRequest): Promise<import("./account.entity").Account[]>;
    upsert(req: AuthenticatedRequest, dto: UpsertAccountDto): Promise<import("./account.entity").Account>;
    remove(req: AuthenticatedRequest, id: string): Promise<{
        success: boolean;
    }>;
}
