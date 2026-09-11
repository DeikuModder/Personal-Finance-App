import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { InvestmentsService } from './investments.service';
import { UpsertInvestmentDto } from './investment.dto';
export declare class InvestmentsController {
    private readonly investmentsService;
    constructor(investmentsService: InvestmentsService);
    getAll(req: AuthenticatedRequest): Promise<import("./investment.entity").Investment[]>;
    upsert(req: AuthenticatedRequest, dto: UpsertInvestmentDto): Promise<import("./investment.entity").Investment>;
    remove(req: AuthenticatedRequest, id: string): Promise<{
        success: boolean;
    }>;
}
