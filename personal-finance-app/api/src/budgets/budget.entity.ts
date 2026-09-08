import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { BudgetItem } from './budget-item.entity';

@Entity('budgets')
export class Budget {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (u) => u.budgets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  category: string;

  @Column('numeric', { transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  amount: number;

  @Column()
  month: number;

  @Column()
  year: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @OneToMany(() => BudgetItem, (b) => b.budget, { cascade: ['remove'], onDelete: 'CASCADE' })
  items: BudgetItem[];
}
