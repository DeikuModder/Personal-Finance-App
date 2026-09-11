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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jose_1 = require("jose");
const users_service_1 = require("../users/users.service");
const auth_decorators_1 = require("./auth.decorators");
const cookie_util_1 = require("./cookie.util");
let JwtAuthGuard = class JwtAuthGuard {
    constructor(usersService, reflector) {
        this.usersService = usersService;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(auth_decorators_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);
        if (!token) {
            throw new common_1.UnauthorizedException('Missing access token');
        }
        try {
            const { payload } = await (0, jose_1.jwtVerify)(token, this.secret(), { algorithms: ['HS256'] });
            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                throw new common_1.UnauthorizedException('Unknown user');
            }
            request.user = {
                email: user.email,
                userId: user.id,
                role: user.role,
                payload,
            };
            return true;
        }
        catch (err) {
            if (err instanceof common_1.UnauthorizedException) {
                throw err;
            }
            throw new common_1.UnauthorizedException('Invalid or expired session');
        }
    }
    secret() {
        return new TextEncoder().encode(process.env.AUTH_JWT_SECRET || '');
    }
    extractToken(request) {
        const auth = request.headers['authorization'];
        if (auth && auth.startsWith('Bearer ')) {
            return auth.slice(7);
        }
        return (0, cookie_util_1.readCookie)(request, 'ft_access');
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        core_1.Reflector])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map