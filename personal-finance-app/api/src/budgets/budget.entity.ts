import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

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
}
