import { Repository } from 'typeorm';
import { Goal } from './goal.entity';
import { UpsertGoalDto } from './goal.dto';
export declare class GoalsService {
    private readonly repo;
    constructor(repo: Repository<Goal>);
    getAll(userId: string): Promise<Goal[]>;
    upsert(userId: string, dto: UpsertGoalDto): Promise<Goal>;
    remove(userId: string, id: string): Promise<void>;
}
