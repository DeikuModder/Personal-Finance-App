import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { TransactionsModule } from './transactions/transactions.module';
import { AccountsModule } from './accounts/accounts.module';
import { BudgetsModule } from './budgets/budgets.module';
import { InvestmentsModule } from './investments/investments.module';
import { ChallengeModule } from './challenge/challenge.module';
import { CategoriesModule } from './categories/categories.module';
import { DebtsModule } from './debts/debts.module';
import { GoalsModule } from './goals/goals.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgres://fintrack:fintrack@localhost:5432/fintrack',
      autoLoadEntities: true,
      synchronize: true,
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    TransactionsModule,
    AccountsModule,
    BudgetsModule,
    InvestmentsModule,
    ChallengeModule,
    CategoriesModule,
    DebtsModule,
    GoalsModule,
    WishlistModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
