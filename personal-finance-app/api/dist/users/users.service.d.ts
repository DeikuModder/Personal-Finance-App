import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UsersService {
    private readonly usersRepo;
    constructor(usersRepo: Repository<User>);
    ensureUserByEmail(email: string): Promise<User>;
    findById(id: string): Promise<User | null>;
    private superadminEmail;
}
