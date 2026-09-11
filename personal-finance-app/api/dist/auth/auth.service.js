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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const jose_1 = require("jose");
const uuid_1 = require("uuid");
const otp_code_entity_1 = require("./otp-code.entity");
const refresh_token_entity_1 = require("./refresh-token.entity");
const allowed_email_entity_1 = require("./allowed-email.entity");
const mail_service_1 = require("./mail.service");
const users_service_1 = require("../users/users.service");
const cookie_util_1 = require("./cookie.util");
const ACCESS_TTL_MS = intEnv('AUTH_ACCESS_TTL_MINUTES', 15) * 60 * 1000;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const ABSOLUTE_TTL_MS = intEnv('AUTH_ABSOLUTE_TTL_DAYS', 30) * 24 * 60 * 60 * 1000;
const DEVICE_TTL_MS = 365 * 24 * 60 * 60 * 1000;
const GC_MS = intEnv('AUTH_REFRESH_GC_DAYS', 7) * 24 * 60 * 60 * 1000;
const GC_INTERVAL_MS = 6 * 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const EMAIL_RATE_MAX = 4;
const IP_RATE_MAX = 8;
const RATE_WINDOW_MS = 10 * 60 * 1000;
function intEnv(key, fallback) {
    const parsed = parseInt(process.env[key] || '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
let AuthService = AuthService_1 = class AuthService {
    constructor(otpRepo, refreshRepo, allowRepo, usersService, mail) {
        this.otpRepo = otpRepo;
        this.refreshRepo = refreshRepo;
        this.allowRepo = allowRepo;
        this.usersService = usersService;
        this.mail = mail;
        this.logger = new common_1.Logger(AuthService_1.name);
        this.emailRequests = new Map();
        this.ipRequests = new Map();
        this.cooldowns = new Map();
        this.gcTimer = null;
    }
    async onModuleInit() {
        const superadmin = this.superadminEmail();
        if (!superadmin)
            return;
        try {
            const existing = await this.allowRepo.findOne({ where: { email: superadmin } });
            if (!existing) {
                await this.allowRepo.save(this.allowRepo.create({ email: superadmin, note: 'Superadmin' }));
                this.logger.log(`Seeded superadmin allowlist entry for ${superadmin}`);
            }
            await this.usersService.ensureUserByEmail(superadmin);
        }
        catch (err) {
            this.logger.error('Failed to seed superadmin', err);
        }
        await this.pruneRefreshTokens();
        this.gcTimer = setInterval(() => {
            this.pruneRefreshTokens().catch((err) => this.logger.error('Failed to prune refresh tokens', err));
        }, GC_INTERVAL_MS);
    }
    onModuleDestroy() {
        if (this.gcTimer) {
            clearInterval(this.gcTimer);
            this.gcTimer = null;
        }
    }
    async requestOtp(emailRaw, ip) {
        const email = this.normalizeEmail(emailRaw);
        if (!email) {
            throw new common_1.BadRequestException('Enter a valid email address');
        }
        if (!(await this.isAllowed(email))) {
            return { success: false, reason: 'not-allowed' };
        }
        if (!this.passRateLimit(`email:${email}`, this.emailRequests, EMAIL_RATE_MAX) || !this.passRateLimit(`ip:${ip}`, this.ipRequests, IP_RATE_MAX)) {
            throw new common_1.BadRequestException('Too many requests. Wait a bit and try again.');
        }
        const last = this.cooldowns.get(email);
        if (last && Date.now() - last < RESEND_COOLDOWN_MS) {
            throw new common_1.BadRequestException("You can request another code in a moment.");
        }
        this.cooldowns.set(email, Date.now());
        const code = String((0, crypto_1.randomInt)(100000, 1000000));
        await this.otpRepo.delete({ email });
        await this.otpRepo.save(this.otpRepo.create({
            email,
            codeHash: this.hash(code),
            expiresAt: new Date(Date.now() + OTP_TTL_MS),
            attempts: 0,
        }));
        await this.mail.sendOtpCode(email, code);
        return { success: true };
    }
    async verifyOtp(emailRaw, code) {
        const email = this.normalizeEmail(emailRaw);
        const otp = email ? await this.otpRepo.findOne({ where: { email } }) : null;
        if (!otp || otp.expiresAt.getTime() < Date.now()) {
            throw new common_1.UnauthorizedException('That code is invalid or expired. Request a new one.');
        }
        if (otp.attempts >= OTP_MAX_ATTEMPTS) {
            await this.otpRepo.remove(otp);
            throw new common_1.UnauthorizedException('That code is invalid or expired. Request a new one.');
        }
        if (this.hash(code) !== otp.codeHash) {
            otp.attempts += 1;
            if (otp.attempts >= OTP_MAX_ATTEMPTS) {
                await this.otpRepo.remove(otp);
            }
            else {
                await this.otpRepo.save(otp);
            }
            throw new common_1.UnauthorizedException('That code is invalid or expired. Request a new one.');
        }
        await this.otpRepo.remove(otp);
        const user = await this.usersService.ensureUserByEmail(email);
        return { id: user.id, email: user.email, role: user.role };
    }
    async issueSession(req, res, user) {
        const access = await this.makeAccessToken(user);
        const refreshValue = (0, crypto_1.randomBytes)(32).toString('base64url');
        let deviceFp = (0, cookie_util_1.readCookie)(req, cookie_util_1.DEVICE_COOKIE);
        if (!deviceFp) {
            deviceFp = (0, crypto_1.randomBytes)(32).toString('base64url');
            res.cookie(cookie_util_1.DEVICE_COOKIE, deviceFp, this.cookieOptions(DEVICE_TTL_MS));
        }
        await this.refreshRepo.save(this.refreshRepo.create({
            userId: user.id,
            tokenHash: this.hash(refreshValue),
            familyId: (0, uuid_1.v4)(),
            deviceHash: this.hash(deviceFp),
            expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        }));
        this.setCookies(res, access, refreshValue);
        return { ...user, expiresIn: Math.round(ACCESS_TTL_MS / 1000) };
    }
    async refresh(req, res) {
        const value = (0, cookie_util_1.readCookie)(req, cookie_util_1.REFRESH_COOKIE);
        if (!value) {
            throw new common_1.UnauthorizedException('No refresh token');
        }
        const token = await this.refreshRepo.findOne({ where: { tokenHash: this.hash(value) } });
        if (!token) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const deviceFp = (0, cookie_util_1.readCookie)(req, cookie_util_1.DEVICE_COOKIE);
        if (!deviceFp || this.hash(deviceFp) !== token.deviceHash) {
            await this.revokeFamily(token.familyId);
            this.clearCookies(res);
            throw new common_1.UnauthorizedException('Session has been revoked');
        }
        if (token.revokedAt || token.expiresAt.getTime() < Date.now()) {
            await this.revokeFamily(token.familyId);
            this.clearCookies(res);
            throw new common_1.UnauthorizedException('Session has been revoked');
        }
        const absoluteDeadline = token.createdAt.getTime() + ABSOLUTE_TTL_MS;
        if (Date.now() > absoluteDeadline) {
            await this.revokeFamily(token.familyId);
            this.clearCookies(res);
            throw new common_1.UnauthorizedException('Session has been revoked');
        }
        const user = await this.usersService.findById(token.userId);
        if (!user) {
            throw new common_1.UnauthorizedException('Unknown user');
        }
        await this.refreshRepo.update(token.id, { revokedAt: new Date() });
        const newValue = (0, crypto_1.randomBytes)(32).toString('base64url');
        await this.refreshRepo.save(this.refreshRepo.create({
            userId: user.id,
            tokenHash: this.hash(newValue),
            familyId: token.familyId,
            deviceHash: this.hash(deviceFp),
            expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        }));
        const access = await this.makeAccessToken({ id: user.id, email: user.email, role: user.role });
        this.setCookies(res, access, newValue);
        return { ok: true, expiresIn: Math.round(ACCESS_TTL_MS / 1000) };
    }
    async logout(req, res) {
        const value = (0, cookie_util_1.readCookie)(req, cookie_util_1.REFRESH_COOKIE);
        if (value) {
            const token = await this.refreshRepo.findOne({ where: { tokenHash: this.hash(value) } });
            if (token) {
                await this.revokeFamily(token.familyId);
            }
        }
        this.clearCookies(res);
        return { success: true };
    }
    async me(req, userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('Unknown user');
        }
        let expiresIn = Math.round(ACCESS_TTL_MS / 1000);
        const accessValue = (0, cookie_util_1.readCookie)(req, cookie_util_1.ACCESS_COOKIE);
        if (accessValue) {
            try {
                const { payload } = await (0, jose_1.jwtVerify)(accessValue, this.secret(), { algorithms: ['HS256'] });
                if (payload.exp) {
                    expiresIn = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
                }
            }
            catch {
            }
        }
        return { id: user.id, email: user.email, role: user.role, expiresIn };
    }
    async getAllowlist() {
        return this.allowRepo.find({ order: { createdAt: 'ASC' } });
    }
    async addToAllowlist(emailRaw, note) {
        const email = this.normalizeEmail(emailRaw);
        if (!email) {
            throw new common_1.BadRequestException('Enter a valid email address');
        }
        const existing = await this.allowRepo.findOne({ where: { email } });
        if (existing) {
            throw new common_1.BadRequestException('That email is already on the list');
        }
        return this.allowRepo.save(this.allowRepo.create({ email, note: note || null }));
    }
    async removeFromAllowlist(emailRaw) {
        const email = this.normalizeEmail(emailRaw);
        if (email === this.superadminEmail()) {
            throw new common_1.BadRequestException("You can't remove the superadmin from the list");
        }
        await this.allowRepo.delete({ email });
        return { success: true };
    }
    async isAllowed(email) {
        if (email === this.superadminEmail())
            return true;
        return !!(await this.allowRepo.findOne({ where: { email } }));
    }
    async makeAccessToken(user) {
        return new jose_1.SignJWT({ email: user.email, role: user.role, type: 'access' })
            .setProtectedHeader({ alg: 'HS256' })
            .setSubject(user.id)
            .setIssuedAt()
            .setExpirationTime(Math.floor(Date.now() / 1000) + ACCESS_TTL_MS / 1000)
            .sign(this.secret());
    }
    setCookies(res, access, refresh) {
        res.cookie(cookie_util_1.ACCESS_COOKIE, access, this.cookieOptions(ACCESS_TTL_MS));
        res.cookie(cookie_util_1.REFRESH_COOKIE, refresh, this.cookieOptions(REFRESH_TTL_MS));
    }
    clearCookies(res) {
        res.clearCookie(cookie_util_1.ACCESS_COOKIE, this.cookieOptions(0));
        res.clearCookie(cookie_util_1.REFRESH_COOKIE, this.cookieOptions(0));
    }
    cookieOptions(maxAge) {
        return {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/',
            maxAge,
        };
    }
    async revokeFamily(familyId) {
        const members = await this.refreshRepo.find({ where: { familyId } });
        if (members.length > 0) {
            await this.refreshRepo.update(members.map((m) => m.id), { revokedAt: new Date() });
        }
    }
    async pruneRefreshTokens() {
        const cutoff = new Date(Date.now() - GC_MS);
        const result = await this.refreshRepo
            .createQueryBuilder()
            .delete()
            .where('("revokedAt" IS NOT NULL AND "revokedAt" < :cutoff) OR "expiresAt" < :cutoff')
            .setParameter('cutoff', cutoff)
            .execute();
        if (result.affected && result.affected > 0) {
            this.logger.log(`Pruned ${result.affected} stale refresh token(s)`);
        }
    }
    hash(value) {
        return (0, crypto_1.createHash)('sha256').update(value).digest('hex');
    }
    secret() {
        return new TextEncoder().encode(process.env.AUTH_JWT_SECRET || '');
    }
    normalizeEmail(email) {
        return (email || '').trim().toLowerCase();
    }
    superadminEmail() {
        return (process.env.SUPERADMIN_EMAIL || '').toLowerCase().trim();
    }
    passRateLimit(key, store, max) {
        const now = Date.now();
        const recent = (store.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
        if (recent.length >= max) {
            return false;
        }
        recent.push(now);
        store.set(key, recent);
        return true;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(otp_code_entity_1.OtpCode)),
    __param(1, (0, typeorm_1.InjectRepository)(refresh_token_entity_1.RefreshToken)),
    __param(2, (0, typeorm_1.InjectRepository)(allowed_email_entity_1.AllowedEmail)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map