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

@Entity('wishlist_items')
export class WishlistItem {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (u) => u.wishlist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  name: string;

  @Column('numeric', { default: 0, transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  price: number;

  @Column({ type: 'text', nullable: true })
  picture: string | null;

  @Column({ type: 'varchar', default: 'active' })
  status: 'active' | 'achieved';

  @Column({ type: 'date', nullable: true })
  achievedAt: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;
}