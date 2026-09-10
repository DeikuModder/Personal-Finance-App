export type WishlistStatus = 'active' | 'achieved';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  picture: string | null;
  status: WishlistStatus;
  achievedAt: string | null;
  createdAt: string;
  updatedAt: string;
}