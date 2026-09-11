"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const health_module_1 = require("./health/health.module");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const jwt_auth_guard_1 = require("./auth/jwt-auth.guard");
const roles_guard_1 = require("./auth/roles.guard");
const transactions_module_1 = require("./transactions/transactions.module");
const accounts_module_1 = require("./accounts/accounts.module");
const budgets_module_1 = require("./budgets/budgets.module");
const investments_module_1 = require("./investments/investments.module");
const challenge_module_1 = require("./challenge/challenge.module");
const categories_module_1 = require("./categories/categories.module");
const debts_module_1 = require("./debts/debts.module");
const goals_module_1 = require("./goals/goals.module");
const wishlist_module_1 = require("./wishlist/wishlist.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                url: process.env.DATABASE_URL || 'postgres://fintrack:fintrack@localhost:5432/fintrack',
                autoLoadEntities: true,
                synchronize: true,
            }),
            health_module_1.HealthModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            transactions_module_1.TransactionsModule,
            accounts_module_1.AccountsModule,
            budgets_module_1.BudgetsModule,
            investments_module_1.InvestmentsModule,
            challenge_module_1.ChallengeModule,
            categories_module_1.CategoriesModule,
            debts_module_1.DebtsModule,
            goals_module_1.GoalsModule,
            wishlist_module_1.WishlistModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map