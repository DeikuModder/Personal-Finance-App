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
exports.CoderController = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const coder_service_1 = require("./coder.service");
const coder_event_relay_1 = require("./coder.event-relay");
const auth_decorators_1 = require("../auth/auth.decorators");
let CoderController = class CoderController {
    constructor(coder, events) {
        this.coder = coder;
        this.events = events;
    }
    health() {
        return this.coder.get('/global/health');
    }
    project() {
        return this.coder.get('/project');
    }
    projectCurrent() {
        return this.coder.get('/project/current');
    }
    path() {
        return this.coder.get('/path');
    }
    vcs() {
        return this.coder.get('/vcs');
    }
    config() {
        return this.coder.get('/config');
    }
    providers() {
        return this.coder.get('/config/providers');
    }
    sessions() {
        return this.coder.get('/session');
    }
    createSession(body) {
        return this.coder.mutate('POST', '/session', body ?? {});
    }
    session(id) {
        return this.coder.get(`/session/${encodeURIComponent(id)}`);
    }
    updateSession(id, body) {
        return this.coder.mutate('PATCH', `/session/${encodeURIComponent(id)}`, body ?? {});
    }
    deleteSession(id) {
        return this.coder.mutate('DELETE', `/session/${encodeURIComponent(id)}`);
    }
    todo(id) {
        return this.coder.get(`/session/${encodeURIComponent(id)}/todo`);
    }
    diff(id, query) {
        return this.coder.get(`/session/${encodeURIComponent(id)}/diff`, query);
    }
    abort(id) {
        return this.coder.mutate('POST', `/session/${encodeURIComponent(id)}/abort`);
    }
    command(id, body) {
        return this.coder.mutate('POST', `/session/${encodeURIComponent(id)}/command`, body ?? {});
    }
    shell(id, body) {
        return this.coder.mutate('POST', `/session/${encodeURIComponent(id)}/shell`, body ?? {});
    }
    messages(id, query) {
        return this.coder.get(`/session/${encodeURIComponent(id)}/message`, query);
    }
    sendMessage(id, body) {
        return this.coder.mutate('POST', `/session/${encodeURIComponent(id)}/message`, body ?? {});
    }
    promptAsync(id, body) {
        return this.coder.mutate('POST', `/session/${encodeURIComponent(id)}/prompt_async`, body ?? {});
    }
    respondPermission(id, permissionID, body) {
        return this.coder.mutate('POST', `/session/${encodeURIComponent(id)}/permissions/${encodeURIComponent(permissionID)}`, body ?? {});
    }
    file(query) {
        return this.coder.get('/file', query);
    }
    fileContent(query) {
        return this.coder.get('/file/content', query);
    }
    fileStatus() {
        return this.coder.get('/file/status');
    }
    find(query) {
        return this.coder.get('/find', query);
    }
    findFile(query) {
        return this.coder.get('/find/file', query);
    }
    eventStream() {
        return this.events.stream();
    }
};
exports.CoderController = CoderController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('project'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "project", null);
__decorate([
    (0, common_1.Get)('project/current'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "projectCurrent", null);
__decorate([
    (0, common_1.Get)('path'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "path", null);
__decorate([
    (0, common_1.Get)('vcs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "vcs", null);
__decorate([
    (0, common_1.Get)('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "config", null);
__decorate([
    (0, common_1.Get)('config/providers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "providers", null);
__decorate([
    (0, common_1.Get)('session'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "sessions", null);
__decorate([
    (0, common_1.Post)('session'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('session/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "session", null);
__decorate([
    (0, common_1.Patch)('session/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "updateSession", null);
__decorate([
    (0, common_1.Delete)('session/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "deleteSession", null);
__decorate([
    (0, common_1.Get)('session/:id/todo'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "todo", null);
__decorate([
    (0, common_1.Get)('session/:id/diff'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "diff", null);
__decorate([
    (0, common_1.Post)('session/:id/abort'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "abort", null);
__decorate([
    (0, common_1.Post)('session/:id/command'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "command", null);
__decorate([
    (0, common_1.Post)('session/:id/shell'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "shell", null);
__decorate([
    (0, common_1.Get)('session/:id/message'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "messages", null);
__decorate([
    (0, common_1.Post)('session/:id/message'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('session/:id/prompt_async'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "promptAsync", null);
__decorate([
    (0, common_1.Post)('session/:id/permissions/:permissionID'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('permissionID')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "respondPermission", null);
__decorate([
    (0, common_1.Get)('file'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "file", null);
__decorate([
    (0, common_1.Get)('file/content'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "fileContent", null);
__decorate([
    (0, common_1.Get)('file/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "fileStatus", null);
__decorate([
    (0, common_1.Get)('find'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "find", null);
__decorate([
    (0, common_1.Get)('find/file'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoderController.prototype, "findFile", null);
__decorate([
    (0, common_1.Sse)('event'),
    (0, common_1.Header)('X-Accel-Buffering', 'no'),
    (0, common_1.Header)('Cache-Control', 'no-cache'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", rxjs_1.Observable)
], CoderController.prototype, "eventStream", null);
exports.CoderController = CoderController = __decorate([
    (0, common_1.Controller)('coder'),
    (0, auth_decorators_1.Roles)(auth_decorators_1.SUPERADMIN),
    __metadata("design:paramtypes", [coder_service_1.CoderService,
        coder_event_relay_1.CoderEventRelay])
], CoderController);
//# sourceMappingURL=coder.controller.js.map