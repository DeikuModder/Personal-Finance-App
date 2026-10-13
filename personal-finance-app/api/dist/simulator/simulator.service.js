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
exports.SimulatorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_entity_1 = require("../transactions/transaction.entity");
const account_entity_1 = require("../accounts/account.entity");
const challenge_config_entity_1 = require("../challenge/challenge-config.entity");
const goal_entity_1 = require("../goals/goal.entity");
const debt_entity_1 = require("../debts/debt.entity");
const wishlist_item_entity_1 = require("../wishlist/wishlist-item.entity");
const history_stats_1 = require("./history.stats");
const simulation_engine_1 = require("./simulation.engine");
const simulator_ai_service_1 = require("./simulator-ai.service");
let SimulatorService = class SimulatorService {
    constructor(tx, acc, chall, goals, debts, wishlist, ai) {
        this.tx = tx;
        this.acc = acc;
        this.chall = chall;
        this.goals = goals;
        this.debts = debts;
        this.wishlist = wishlist;
        this.ai = ai;
    }
    async getStats(userId) {
        const [transactions, accounts, challenge, goals, debts, wishlist] = await Promise.all([
            this.tx.find({ where: { userId } }),
            this.acc.find({ where: { userId } }),
            this.chall.findOne({ where: { userId } }),
            this.goals.find({ where: { userId } }),
            this.debts.find({ where: { userId } }),
            this.wishlist.find({ where: { userId } }),
        ]);
        return (0, history_stats_1.computeHistoryStats)({ transactions, accounts, challenge, goals, debts, wishlist });
    }
    async run(userId, dto) {
        const stats = await this.getStats(userId);
        return (0, simulation_engine_1.runSimulation)(stats, dto);
    }
    async interpret(userId, dto) {
        const stats = await this.getStats(userId);
        return this.ai.interpret(dto.text, dto.scenario ?? {}, stats);
    }
    async report(userId, dto) {
        const stats = await this.getStats(userId);
        const result = (0, simulation_engine_1.runSimulation)(stats, dto);
        return this.ai.report(stats, result, dto.scenario ?? {});
    }
};
exports.SimulatorService = SimulatorService;
exports.SimulatorService = SimulatorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(1, (0, typeorm_1.InjectRepository)(account_entity_1.Account)),
    __param(2, (0, typeorm_1.InjectRepository)(challenge_config_entity_1.ChallengeConfig)),
    __param(3, (0, typeorm_1.InjectRepository)(goal_entity_1.Goal)),
    __param(4, (0, typeorm_1.InjectRepository)(debt_entity_1.Debt)),
    __param(5, (0, typeorm_1.InjectRepository)(wishlist_item_entity_1.WishlistItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        simulator_ai_service_1.SimulatorAiService])
], SimulatorService);
//# sourceMappingURL=simulator.service.js.map