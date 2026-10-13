import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { Account } from '../accounts/account.entity';
import { ChallengeConfig } from '../challenge/challenge-config.entity';
import { Goal } from '../goals/goal.entity';
import { Debt } from '../debts/debt.entity';
import { WishlistItem } from '../wishlist/wishlist-item.entity';
import { SimulatorController } from './simulator.controller';
import { SimulatorService } from './simulator.service';
import { SimulatorAiService } from './simulator-ai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Account, ChallengeConfig, Goal, Debt, WishlistItem]),
  ],
  controllers: [SimulatorController],
  providers: [SimulatorService, SimulatorAiService],
})
export class SimulatorModule {}