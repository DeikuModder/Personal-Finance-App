import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('accounts')
export class Account {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (u) => u.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  name: string;

  @Column()
  type: 'checking' | 'savings' | 'cash' | 'credit_card' | 'other';

  @Column('numeric', { transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  balance: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: '#ff6e6e' })
  color: string;

  @Column({ default: 'account_balance_wallet' })
  icon: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;
}
