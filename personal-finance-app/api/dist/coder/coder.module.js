"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoderModule = void 0;
const common_1 = require("@nestjs/common");
const coder_controller_1 = require("./coder.controller");
const coder_service_1 = require("./coder.service");
const coder_event_relay_1 = require("./coder.event-relay");
let CoderModule = class CoderModule {
};
exports.CoderModule = CoderModule;
exports.CoderModule = CoderModule = __decorate([
    (0, common_1.Module)({
        controllers: [coder_controller_1.CoderController],
        providers: [coder_service_1.CoderService, coder_event_relay_1.CoderEventRelay],
    })
], CoderModule);
//# sourceMappingURL=coder.module.js.map