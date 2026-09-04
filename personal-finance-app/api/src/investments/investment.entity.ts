import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('investments')
export class Investment {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (u) => u.investments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  name: string;

  @Column()
  type: 'stock' | 'crypto' | 'bond' | 'savings_account' | 'real_estate' | 'other';

  @Column({ nullable: true })
  symbol: string;

  @Column({ type: 'numeric', nullable: true, transformer: { to: (v: number) => v, from: (v: string) => (v === null ? null : Number(v)) } })
  shares: number;

  @Column('numeric', { transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  purchasePrice: number;

  @Column('numeric', { transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  currentPrice: number;

  @Column({ type: 'numeric', nullable: true, name: 'dividend_per_share', transformer: { to: (v: number) => v, from: (v: string) => (v === null ? null : Number(v)) } })
  dividendPerShare: number;

  @Column({ name: 'last_updated', default: '' })
  lastUpdated: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;
}
