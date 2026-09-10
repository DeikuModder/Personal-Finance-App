export declare class UpsertWishlistItemDto {
    id: string;
    name: string;
    price?: number;
    picture?: string;
    status?: 'active' | 'achieved';
    achievedAt?: string;
    createdAt?: string;
}
