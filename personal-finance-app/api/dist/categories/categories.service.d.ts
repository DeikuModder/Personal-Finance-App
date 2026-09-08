import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { UpsertCategoryDto } from './category.dto';
export declare class CategoriesService {
    private readonly repo;
    constructor(repo: Repository<Category>);
    getAll(userId: string): Promise<Category[]>;
    upsert(userId: string, dto: UpsertCategoryDto): Promise<Category>;
    remove(userId: string, id: string): Promise<void>;
}
