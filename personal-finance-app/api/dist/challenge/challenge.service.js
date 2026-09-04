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
exports.ChallengeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const challenge_config_entity_1 = require("./challenge-config.entity");
let ChallengeService = class ChallengeService {
    constructor(repo) {
        this.repo = repo;
    }
    async get(userId) {
        return this.repo.findOne({ where: { userId } });
    }
    async put(userId, dto) {
        const existing = await this.get(userId);
        const entity = this.repo.create({
            id: existing?.id,
            userId,
            monthlyIncome: dto.monthlyIncome,
            weeklyMax: dto.weeklyMax,
            enabled: dto.enabled,
            createdAt: existing?.createdAt ?? dto.createdAt ?? new Date().toISOString(),
        });
        return this.repo.save(entity);
    }
};
exports.ChallengeService = ChallengeService;
exports.ChallengeService = ChallengeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(challenge_config_entity_1.ChallengeConfig)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ChallengeService);
//# sourceMappingURL=challenge.service.js.map