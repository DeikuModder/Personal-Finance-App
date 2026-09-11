import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { GoalsService } from './goals.service';
import { UpsertGoalDto } from './goal.dto';
export declare class GoalsController {
    private readonly goalsService;
    constructor(goalsService: GoalsService);
    getAll(req: AuthenticatedRequest): Promise<import("./goal.entity").Goal[]>;
    upsert(req: AuthenticatedRequest, dto: UpsertGoalDto): Promise<import("./goal.entity").Goal>;
    remove(req: AuthenticatedRequest, id: string): Promise<{
        success: boolean;
    }>;
}
