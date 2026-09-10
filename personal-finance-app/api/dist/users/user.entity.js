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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const transaction_entity_1 = require("../transactions/transaction.entity");
const account_entity_1 = require("../accounts/account.entity");
const budget_entity_1 = require("../budgets/budget.entity");
const investment_entity_1 = require("../investments/investment.entity");
const challenge_config_entity_1 = require("../challenge/challenge-config.entity");
const category_entity_1 = require("../categories/category.entity");
const budget_item_entity_1 = require("../budgets/budget-item.entity");
const debt_entity_1 = require("../debts/debt.entity");
const goal_entity_1 = require("../goals/goal.entity");
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => transaction_entity_1.Transaction, (t) => t.user),
    __metadata("design:type", Array)
], User.prototype, "transactions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => account_entity_1.Account, (a) => a.user),
    __metadata("design:type", Array)
], User.prototype, "accounts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => budget_entity_1.Budget, (b) => b.user),
    __metadata("design:type", Array)
], User.prototype, "budgets", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => investment_entity_1.Investment, (i) => i.user),
    __metadata("design:type", Array)
], User.prototype, "investments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => challenge_config_entity_1.ChallengeConfig, (c) => c.user),
    __metadata("design:type", Array)
], User.prototype, "challengeConfigs", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => category_entity_1.Category, (c) => c.user),
    __metadata("design:type", Array)
], User.prototype, "categories", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => budget_item_entity_1.BudgetItem, (b) => b.user),
    __metadata("design:type", Array)
], User.prototype, "budgetItems", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => debt_entity_1.Debt, (d) => d.user),
    __metadata("design:type", Array)
], User.prototype, "debts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => goal_entity_1.Goal, (g) => g.user),
    __metadata("design:type", Array)
], User.prototype, "goals", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map