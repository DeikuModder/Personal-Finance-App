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
exports.Investment = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
let Investment = class Investment {
};
exports.Investment = Investment;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], Investment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Investment.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (u) => u.investments, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Investment.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Investment.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Investment.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Investment.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', nullable: true, transformer: { to: (v) => v, from: (v) => (v === null ? null : Number(v)) } }),
    __metadata("design:type", Number)
], Investment.prototype, "shares", void 0);
__decorate([
    (0, typeorm_1.Column)('numeric', { transformer: { to: (v) => v, from: (v) => Number(v) } }),
    __metadata("design:type", Number)
], Investment.prototype, "purchasePrice", void 0);
__decorate([
    (0, typeorm_1.Column)('numeric', { transformer: { to: (v) => v, from: (v) => Number(v) } }),
    __metadata("design:type", Number)
], Investment.prototype, "currentPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', nullable: true, name: 'dividend_per_share', transformer: { to: (v) => v, from: (v) => (v === null ? null : Number(v)) } }),
    __metadata("design:type", Number)
], Investment.prototype, "dividendPerShare", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_updated', default: '' }),
    __metadata("design:type", String)
], Investment.prototype, "lastUpdated", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", String)
], Investment.prototype, "createdAt", void 0);
exports.Investment = Investment = __decorate([
    (0, typeorm_1.Entity)('investments')
], Investment);
//# sourceMappingURL=investment.entity.js.map