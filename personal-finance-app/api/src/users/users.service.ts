import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { SUPERADMIN } from '../auth/auth.decorators';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>
  ) {}

  /** Finds or creates a user for an OTP-verified email, applying role rules. */
  async ensureUserByEmail(email: string): Promise<User> {
    const normalized = email.toLowerCase().trim();
    let user = await this.usersRepo.findOne({ where: { email: normalized } });
    const isSuper = normalized === this.superadminEmail();
    if (!user) {
      user = this.usersRepo.create({ email: normalized, role: isSuper ? SUPERADMIN : 'user' });
      return this.usersRepo.save(user);
    }
    if (isSuper && user.role !== SUPERADMIN) {
      user.role = SUPERADMIN;
      return this.usersRepo.save(user);
    }
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  private superadminEmail(): string {
    return (process.env.SUPERADMIN_EMAIL || '').toLowerCase().trim();
  }
}