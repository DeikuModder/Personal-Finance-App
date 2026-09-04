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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CfAccessGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jose_1 = require("jose");
const users_service_1 = require("../users/users.service");
const auth_decorators_1 = require("./auth.decorators");
let CfAccessGuard = class CfAccessGuard {
    constructor(usersService, reflector) {
        this.usersService = usersService;
        this.reflector = reflector;
    }
    get teamDomain() {
        return (process.env.CF_TEAM_DOMAIN || '').replace(/\/+$/, '');
    }
    get aud() {
        return process.env.CF_AUD || '';
    }
    getJwks() {
        if (!this.jwks) {
            this.jwks = (0, jose_1.createRemoteJWKSet)(new URL(`${this.teamDomain}/cdn-cgi/access/certs`));
        }
        return this.jwks;
    }
    async canActivate(context) {
        const skip = this.reflector.getAllAndOverride(auth_decorators_1.SKIP_CF_AUTH, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (skip) {
            return true;
        }
        if (!this.teamDomain || !this.aud) {
            throw new common_1.UnauthorizedException('CF_TEAM_DOMAIN and CF_AUD are required');
        }
        const request = context.switchToHttp().getRequest();
        const token = request.headers['cf-access-jwt-assertion'];
        if (!token) {
            throw new common_1.UnauthorizedException('Missing Cloudflare Access token');
        }
        try {
            const { payload } = await (0, jose_1.jwtVerify)(token, this.getJwks(), {
                issuer: this.teamDomain,
                audience: this.aud,
            });
            const email = payload.email ||
                payload.identity ||
                payload.sub;
            if (!email) {
                throw new common_1.UnauthorizedException('No identity in token');
            }
            const user = await this.usersService.resolveByEmail(email);
            const authUser = {
                email,
                userId: user.id,
                payload,
            };
            request.user = authUser;
            return true;
        }
        catch (err) {
            if (err instanceof common_1.UnauthorizedException) {
                throw err;
            }
            throw new common_1.UnauthorizedException('Invalid Cloudflare Access token');
        }
    }
};
exports.CfAccessGuard = CfAccessGuard;
exports.CfAccessGuard = CfAccessGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        core_1.Reflector])
], CfAccessGuard);
//# sourceMappingURL=cf-access.guard.js.map