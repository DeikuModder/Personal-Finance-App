import { Repository } from 'typeorm';
import { ChallengeConfig } from './challenge-config.entity';
import { PutChallengeConfigDto } from './challenge-config.dto';
export declare class ChallengeService {
    private readonly repo;
    constructor(repo: Repository<ChallengeConfig>);
    get(userId: string): Promise<ChallengeConfig | null>;
    put(userId: string, dto: PutChallengeConfigDto): Promise<ChallengeConfig>;
}
