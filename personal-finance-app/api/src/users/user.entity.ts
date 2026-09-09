import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';
import { Account } from '../accounts/account.entity';
import { Budget } from '../budgets/budget.entity';
import { Investment } from '../investments/investment.entity';
import { ChallengeConfig } from '../challenge/challenge-config.entity';
import { Category } from '../categories/category.entity';
import { BudgetItem } from '../budgets/budget-item.entity';
import { Debt } from '../debts/debt.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Transaction, (t) => t.user)
  transactions: Transaction[];

  @OneToMany(() => Account, (a) => a.user)
  accounts: Account[];

  @OneToMany(() => Budget, (b) => b.user)
  budgets: Budget[];

  @OneToMany(() => Investment, (i) => i.user)
  investments: Investment[];

  @OneToMany(() => ChallengeConfig, (c) => c.user)
  challengeConfigs: ChallengeConfig[];

  @OneToMany(() => Category, (c) => c.user)
  categories: Category[];

  @OneToMany(() => BudgetItem, (b) => b.user)
  budgetItems: BudgetItem[];

  @OneToMany(() => Debt, (d) => d.user)
  debts: Debt[];
}
