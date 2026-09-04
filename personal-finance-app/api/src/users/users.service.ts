import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>
  ) {}

  async resolveByEmail(email: string): Promise<User> {
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) return existing;
    const created = this.usersRepo.create({ email });
    return this.usersRepo.save(created);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }
}
