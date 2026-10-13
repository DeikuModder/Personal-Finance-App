"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimulatorModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const transaction_entity_1 = require("../transactions/transaction.entity");
const account_entity_1 = require("../accounts/account.entity");
const challenge_config_entity_1 = require("../challenge/challenge-config.entity");
const goal_entity_1 = require("../goals/goal.entity");
const debt_entity_1 = require("../debts/debt.entity");
const wishlist_item_entity_1 = require("../wishlist/wishlist-item.entity");
const simulator_controller_1 = require("./simulator.controller");
const simulator_service_1 = require("./simulator.service");
const simulator_ai_service_1 = require("./simulator-ai.service");
let SimulatorModule = class SimulatorModule {
};
exports.SimulatorModule = SimulatorModule;
exports.SimulatorModule = SimulatorModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([transaction_entity_1.Transaction, account_entity_1.Account, challenge_config_entity_1.ChallengeConfig, goal_entity_1.Goal, debt_entity_1.Debt, wishlist_item_entity_1.WishlistItem]),
        ],
        controllers: [simulator_controller_1.SimulatorController],
        providers: [simulator_service_1.SimulatorService, simulator_ai_service_1.SimulatorAiService],
    })
], SimulatorModule);
//# sourceMappingURL=simulator.module.js.map