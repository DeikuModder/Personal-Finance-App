import { AuthenticatedRequest } from '../auth/cf-access.guard';
import { ChallengeService } from './challenge.service';
import { PutChallengeConfigDto } from './challenge-config.dto';
export declare class ChallengeController {
    private readonly challengeService;
    constructor(challengeService: ChallengeService);
    get(req: AuthenticatedRequest): Promise<import("./challenge-config.entity").ChallengeConfig | {
        monthlyIncome: number;
        weeklyMax: number;
        enabled: false;
        createdAt: string;
    }>;
    put(req: AuthenticatedRequest, dto: PutChallengeConfigDto): Promise<import("./challenge-config.entity").ChallengeConfig>;
}
