import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { CfAccessGuard } from './auth/cf-access.guard';
import { TransactionsModule } from './transactions/transactions.module';
import { AccountsModule } from './accounts/accounts.module';
import { BudgetsModule } from './budgets/budgets.module';
import { InvestmentsModule } from './investments/investments.module';
import { ChallengeModule } from './challenge/challenge.module';

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
    TransactionsModule,
    AccountsModule,
    BudgetsModule,
    InvestmentsModule,
    ChallengeModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CfAccessGuard,
    },
  ],
})
export class AppModule {}
