import { Repository } from 'typeorm';
import { WishlistItem } from './wishlist-item.entity';
import { UpsertWishlistItemDto } from './wishlist-item.dto';
export declare class WishlistService {
    private readonly repo;
    constructor(repo: Repository<WishlistItem>);
    getAll(userId: string): Promise<WishlistItem[]>;
    upsert(userId: string, dto: UpsertWishlistItemDto): Promise<WishlistItem>;
    remove(userId: string, id: string): Promise<void>;
}
