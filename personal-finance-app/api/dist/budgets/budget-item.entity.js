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
exports.BudgetItem = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const budget_entity_1 = require("./budget.entity");
let BudgetItem = class BudgetItem {
};
exports.BudgetItem = BudgetItem;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], BudgetItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], BudgetItem.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (u) => u.budgetItems, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], BudgetItem.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { name: 'budget_id' }),
    __metadata("design:type", String)
], BudgetItem.prototype, "budgetId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => budget_entity_1.Budget, (b) => b.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'budget_id' }),
    __metadata("design:type", budget_entity_1.Budget)
], BudgetItem.prototype, "budget", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BudgetItem.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)('numeric', { transformer: { to: (v) => v, from: (v) => Number(v) } }),
    __metadata("design:type", Number)
], BudgetItem.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", String)
], BudgetItem.prototype, "createdAt", void 0);
exports.BudgetItem = BudgetItem = __decorate([
    (0, typeorm_1.Entity)('budget_items')
], BudgetItem);
//# sourceMappingURL=budget-item.entity.js.map