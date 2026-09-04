"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengeModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const challenge_config_entity_1 = require("./challenge-config.entity");
const challenge_service_1 = require("./challenge.service");
const challenge_controller_1 = require("./challenge.controller");
let ChallengeModule = class ChallengeModule {
};
exports.ChallengeModule = ChallengeModule;
exports.ChallengeModule = ChallengeModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([challenge_config_entity_1.ChallengeConfig])],
        providers: [challenge_service_1.ChallengeService],
        controllers: [challenge_controller_1.ChallengeController],
    })
], ChallengeModule);
//# sourceMappingURL=challenge.module.js.map