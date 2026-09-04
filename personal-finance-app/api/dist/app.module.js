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
const cf_access_guard_1 = require("./auth/cf-access.guard");
const transactions_module_1 = require("./transactions/transactions.module");
const accounts_module_1 = require("./accounts/accounts.module");
const budgets_module_1 = require("./budgets/budgets.module");
const investments_module_1 = require("./investments/investments.module");
const challenge_module_1 = require("./challenge/challenge.module");
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
            transactions_module_1.TransactionsModule,
            accounts_module_1.AccountsModule,
            budgets_module_1.BudgetsModule,
            investments_module_1.InvestmentsModule,
            challenge_module_1.ChallengeModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: cf_access_guard_1.CfAccessGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map