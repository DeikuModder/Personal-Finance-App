import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('challenge_configs')
@Unique('UQ_challenge_user', ['userId'])
export class ChallengeConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (u) => u.challengeConfigs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'monthly_income', type: 'numeric', transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  monthlyIncome: number;

  @Column({ name: 'weekly_max', type: 'numeric', transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  weeklyMax: number;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;
}
