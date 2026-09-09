import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('debts')
export class Debt {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (u) => u.debts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  creditor: string;

  @Column({ nullable: true })
  description: string | null;

  @Column('numeric', { transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  amountOwed: number;

  @Column('numeric', { default: 0, transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  interestRate: number;

  @Column('numeric', { default: 0, transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  minimumPayment: number;

  @Column({ type: 'varchar', default: 'active' })
  status: 'active' | 'paid';

  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ type: 'date', nullable: true })
  remindOn: string | null;

  @Column({ type: 'date', nullable: true })
  paidAt: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;
}