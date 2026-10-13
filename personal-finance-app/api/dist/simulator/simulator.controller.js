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
exports.SimulatorController = void 0;
const common_1 = require("@nestjs/common");
const simulator_service_1 = require("./simulator.service");
const simulator_dto_1 = require("./simulator.dto");
let SimulatorController = class SimulatorController {
    constructor(simulator) {
        this.simulator = simulator;
    }
    stats(req) {
        return this.simulator.getStats(req.user.userId);
    }
    run(req, dto) {
        return this.simulator.run(req.user.userId, dto);
    }
    interpret(req, dto) {
        return this.simulator.interpret(req.user.userId, dto);
    }
    report(req, dto) {
        return this.simulator.report(req.user.userId, dto);
    }
};
exports.SimulatorController = SimulatorController;
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SimulatorController.prototype, "stats", null);
__decorate([
    (0, common_1.Post)('run'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, simulator_dto_1.SimulatorRunDto]),
    __metadata("design:returntype", void 0)
], SimulatorController.prototype, "run", null);
__decorate([
    (0, common_1.Post)('interpret'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, simulator_dto_1.InterpretDto]),
    __metadata("design:returntype", void 0)
], SimulatorController.prototype, "interpret", null);
__decorate([
    (0, common_1.Post)('report'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, simulator_dto_1.ReportDto]),
    __metadata("design:returntype", void 0)
], SimulatorController.prototype, "report", null);
exports.SimulatorController = SimulatorController = __decorate([
    (0, common_1.Controller)('simulator'),
    __metadata("design:paramtypes", [simulator_service_1.SimulatorService])
], SimulatorController);
//# sourceMappingURL=simulator.controller.js.map