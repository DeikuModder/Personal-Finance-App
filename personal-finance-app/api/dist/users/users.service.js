"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const auth_decorators_1 = require("../auth/auth.decorators");
let UsersService = class UsersService {
    constructor(usersRepo) {
        this.usersRepo = usersRepo;
    }
    async ensureUserByEmail(email) {
        const normalized = email.toLowerCase().trim();
        let user = await this.usersRepo.findOne({ where: { email: normalized } });
        const isSuper = normalized === this.superadminEmail();
        if (!user) {
            user = this.usersRepo.create({ email: normalized, role: isSuper ? auth_decorators_1.SUPERADMIN : 'user' });
            return this.usersRepo.save(user);
        }
        if (isSuper && user.role !== auth_decorators_1.SUPERADMIN) {
            user.role = auth_decorators_1.SUPERADMIN;
            return this.usersRepo.save(user);
        }
        return user;
    }
    async findById(id) {
        return this.usersRepo.findOne({ where: { id } });
    }
    superadminEmail() {
        return (process.env.SUPERADMIN_EMAIL || '').toLowerCase().trim();
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map