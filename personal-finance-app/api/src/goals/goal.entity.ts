import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('goals')
export class Goal {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (u) => u.goals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  type: 'savings' | 'streak';

  @Column()
  title: string;

  @Column({ default: 'flag' })
  icon: string;

  @Column('numeric', { default: 0, transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  targetAmount: number;

  @Column({ type: 'date', nullable: true })
  deadline: string | null;

  @Column({ type: 'text', nullable: true })
  picture: string | null;

  @Column({ nullable: true })
  category: string | null;

  @Column('numeric', { default: 0, transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  allowance: number;

  @Column({ default: 'day' })
  allowancePeriod: 'day' | 'week';

  @Column({ type: 'int', nullable: true })
  streakTarget: number | null;

  @Column({ default: 'active' })
  status: 'active' | 'completed';

  @Column({ type: 'date', nullable: true })
  achievedAt: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;
}