import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { UpsertCategoryDto } from './category.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    getAll(req: AuthenticatedRequest): Promise<import("./category.entity").Category[]>;
    upsert(req: AuthenticatedRequest, dto: UpsertCategoryDto): Promise<import("./category.entity").Category>;
    remove(req: AuthenticatedRequest, id: string): Promise<{
        success: boolean;
    }>;
}
