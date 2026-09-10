import { AuthenticatedRequest } from '../auth/cf-access.guard';
import { WishlistService } from './wishlist.service';
import { UpsertWishlistItemDto } from './wishlist-item.dto';
export declare class WishlistController {
    private readonly wishlistService;
    constructor(wishlistService: WishlistService);
    getAll(req: AuthenticatedRequest): Promise<import("./wishlist-item.entity").WishlistItem[]>;
    upsert(req: AuthenticatedRequest, dto: UpsertWishlistItemDto): Promise<import("./wishlist-item.entity").WishlistItem>;
    remove(req: AuthenticatedRequest, id: string): Promise<{
        success: boolean;
    }>;
}
