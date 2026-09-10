import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './wishlist-item.entity';
import { UpsertWishlistItemDto } from './wishlist-item.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly repo: Repository<WishlistItem>
  ) {}

  async getAll(userId: string): Promise<WishlistItem[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  async upsert(userId: string, dto: UpsertWishlistItemDto): Promise<WishlistItem> {
    const existing = await this.repo.findOne({ where: { id: dto.id, userId } });
    const entity = this.repo.create({
      ...dto,
      userId,
      name: dto.name,
      price: dto.price ?? 0,
      picture: dto.picture ?? null,
      status: dto.status ?? 'active',
      achievedAt: dto.achievedAt ?? null,
      createdAt: existing?.createdAt ?? dto.createdAt ?? new Date().toISOString(),
    });
    return this.repo.save(entity);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundException('Wishlist item not found');
    }
    await this.repo.remove(existing);
  }
}