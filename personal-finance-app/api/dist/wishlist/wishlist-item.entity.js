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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WishlistItem = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
let WishlistItem = class WishlistItem {
};
exports.WishlistItem = WishlistItem;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], WishlistItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], WishlistItem.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (u) => u.wishlist, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], WishlistItem.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], WishlistItem.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)('numeric', { default: 0, transformer: { to: (v) => v, from: (v) => Number(v) } }),
    __metadata("design:type", Number)
], WishlistItem.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WishlistItem.prototype, "picture", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: 'active' }),
    __metadata("design:type", String)
], WishlistItem.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], WishlistItem.prototype, "achievedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", String)
], WishlistItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", String)
], WishlistItem.prototype, "updatedAt", void 0);
exports.WishlistItem = WishlistItem = __decorate([
    (0, typeorm_1.Entity)('wishlist_items')
], WishlistItem);
//# sourceMappingURL=wishlist-item.entity.js.map