"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WishlistService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wishlist_item_entity_1 = require("./wishlist-item.entity");
let WishlistService = class WishlistService {
    constructor(repo) {
        this.repo = repo;
    }
    async getAll(userId) {
        return this.repo.find({
            where: { userId },
            order: { createdAt: 'ASC' },
        });
    }
    async upsert(userId, dto) {
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
    async remove(userId, id) {
        const existing = await this.repo.findOne({ where: { id, userId } });
        if (!existing) {
            throw new common_1.NotFoundException('Wishlist item not found');
        }
        await this.repo.remove(existing);
    }
};
exports.WishlistService = WishlistService;
exports.WishlistService = WishlistService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wishlist_item_entity_1.WishlistItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], WishlistService);
//# sourceMappingURL=wishlist.service.js.map