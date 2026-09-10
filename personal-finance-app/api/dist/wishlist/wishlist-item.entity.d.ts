import { User } from '../users/user.entity';
export declare class WishlistItem {
    id: string;
    userId: string;
    user: User;
    name: string;
    price: number;
    picture: string | null;
    status: 'active' | 'achieved';
    achievedAt: string | null;
    createdAt: string;
    updatedAt: string;
}
