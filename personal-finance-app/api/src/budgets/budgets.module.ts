import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from './budget.entity';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { BudgetItem } from './budget-item.entity';
import { BudgetItemsService } from './budget-items.service';
import { BudgetItemsController } from './budget-items.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Budget, BudgetItem])],
  providers: [BudgetsService, BudgetItemsService],
  controllers: [BudgetsController, BudgetItemsController],
})
export class BudgetsModule {}
