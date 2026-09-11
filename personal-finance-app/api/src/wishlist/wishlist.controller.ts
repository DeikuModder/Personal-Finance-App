import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { WishlistService } from './wishlist.service';
import { UpsertWishlistItemDto } from './wishlist-item.dto';

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async getAll(@Req() req: AuthenticatedRequest) {
    return this.wishlistService.getAll(req.user!.userId);
  }

  @Post()
  async upsert(@Req() req: AuthenticatedRequest, @Body() dto: UpsertWishlistItemDto) {
    return this.wishlistService.upsert(req.user!.userId, dto);
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.wishlistService.remove(req.user!.userId, id);
    return { success: true };
  }
}