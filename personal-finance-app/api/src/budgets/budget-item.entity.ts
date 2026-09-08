import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Budget } from './budget.entity';

@Entity('budget_items')
export class BudgetItem {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (u) => u.budgetItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid', { name: 'budget_id' })
  budgetId: string;

  @ManyToOne(() => Budget, (b) => b.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column()
  name: string;

  @Column('numeric', { transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  price: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;
}