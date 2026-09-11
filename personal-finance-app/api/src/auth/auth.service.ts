import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes, randomInt } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { OtpCode } from './otp-code.entity';
import { RefreshToken } from './refresh-token.entity';
import { AllowedEmail } from './allowed-email.entity';
import { MailService } from './mail.service';
import { UsersService } from '../users/users.service';
import { SUPERADMIN } from './auth.decorators';
import { ACCESS_COOKIE, DEVICE_COOKIE, REFRESH_COOKIE, readCookie } from './cookie.util';
import type { AuthenticatedRequest } from './jwt-auth.guard';

export interface SessionUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthSession extends SessionUser {
  expiresIn: number;
}

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

function intEnv(key: string, fallback: number): number {
  const parsed = parseInt(process.env[key] || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private emailRequests = new Map<string, number[]>();
  private ipRequests = new Map<string, number[]>();
  private cooldowns = new Map<string, number>();
  private gcTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectRepository(OtpCode)
    private readonly otpRepo: Repository<OtpCode>,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
    @InjectRepository(AllowedEmail)
    private readonly allowRepo: Repository<AllowedEmail>,
    private readonly usersService: UsersService,
    private readonly mail: MailService
  ) {}

  async onModuleInit(): Promise<void> {
    const superadmin = this.superadminEmail();
    if (!superadmin) return;
    try {
      const existing = await this.allowRepo.findOne({ where: { email: superadmin } });
      if (!existing) {
        await this.allowRepo.save(this.allowRepo.create({ email: superadmin, note: 'Superadmin' }));
        this.logger.log(`Seeded superadmin allowlist entry for ${superadmin}`);
      }
      await this.usersService.ensureUserByEmail(superadmin);
    } catch (err) {
      this.logger.error('Failed to seed superadmin', err);
    }

    await this.pruneRefreshTokens();
    this.gcTimer = setInterval(() => {
      this.pruneRefreshTokens().catch((err) =>
        this.logger.error('Failed to prune refresh tokens', err)
      );
    }, GC_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
    }
  }

  async requestOtp(emailRaw: string, ip: string): Promise<{ success: boolean; reason?: string }> {
    const email = this.normalizeEmail(emailRaw);
    if (!email) {
      throw new BadRequestException('Enter a valid email address');
    }
    if (!(await this.isAllowed(email))) {
      return { success: false, reason: 'not-allowed' };
    }
    if (!this.passRateLimit(`email:${email}`, this.emailRequests, EMAIL_RATE_MAX) || !this.passRateLimit(`ip:${ip}`, this.ipRequests, IP_RATE_MAX)) {
      throw new BadRequestException('Too many requests. Wait a bit and try again.');
    }
    const last = this.cooldowns.get(email);
    if (last && Date.now() - last < RESEND_COOLDOWN_MS) {
      throw new BadRequestException("You can request another code in a moment.");
    }
    this.cooldowns.set(email, Date.now());

    const code = String(randomInt(100000, 1000000));
    await this.otpRepo.delete({ email });
    await this.otpRepo.save(
      this.otpRepo.create({
        email,
        codeHash: this.hash(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        attempts: 0,
      })
    );
    await this.mail.sendOtpCode(email, code);
    return { success: true };
  }

  async verifyOtp(emailRaw: string, code: string): Promise<SessionUser> {
    const email = this.normalizeEmail(emailRaw);
    const otp = email ? await this.otpRepo.findOne({ where: { email } }) : null;
    if (!otp || otp.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('That code is invalid or expired. Request a new one.');
    }
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      await this.otpRepo.remove(otp);
      throw new UnauthorizedException('That code is invalid or expired. Request a new one.');
    }
    if (this.hash(code) !== otp.codeHash) {
      otp.attempts += 1;
      if (otp.attempts >= OTP_MAX_ATTEMPTS) {
        await this.otpRepo.remove(otp);
      } else {
        await this.otpRepo.save(otp);
      }
      throw new UnauthorizedException('That code is invalid or expired. Request a new one.');
    }
    await this.otpRepo.remove(otp);

    const user = await this.usersService.ensureUserByEmail(email);
    return { id: user.id, email: user.email, role: user.role };
  }

  async issueSession(req: AuthenticatedRequest, res: Response, user: SessionUser): Promise<AuthSession> {
    const access = await this.makeAccessToken(user);
    const refreshValue = randomBytes(32).toString('base64url');

    let deviceFp = readCookie(req, DEVICE_COOKIE);
    if (!deviceFp) {
      deviceFp = randomBytes(32).toString('base64url');
      res.cookie(DEVICE_COOKIE, deviceFp, this.cookieOptions(DEVICE_TTL_MS));
    }

    await this.refreshRepo.save(
      this.refreshRepo.create({
        userId: user.id,
        tokenHash: this.hash(refreshValue),
        familyId: uuidv4(),
        deviceHash: this.hash(deviceFp),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      })
    );

    this.setCookies(res, access, refreshValue);
    return { ...user, expiresIn: Math.round(ACCESS_TTL_MS / 1000) };
  }

  async refresh(req: AuthenticatedRequest, res: Response): Promise<{ ok: boolean; expiresIn: number }> {
    const value = readCookie(req, REFRESH_COOKIE);
    if (!value) {
      throw new UnauthorizedException('No refresh token');
    }
    const token = await this.refreshRepo.findOne({ where: { tokenHash: this.hash(value) } });
    if (!token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Device binding: a refresh from a different browser/device is treated as theft.
    const deviceFp = readCookie(req, DEVICE_COOKIE);
    if (!deviceFp || this.hash(deviceFp) !== token.deviceHash) {
      await this.revokeFamily(token.familyId);
      this.clearCookies(res);
      throw new UnauthorizedException('Session has been revoked');
    }

    if (token.revokedAt || token.expiresAt.getTime() < Date.now()) {
      // Reuse of a revoked/expired token -> revoke the whole family.
      await this.revokeFamily(token.familyId);
      this.clearCookies(res);
      throw new UnauthorizedException('Session has been revoked');
    }

    const absoluteDeadline = token.createdAt.getTime() + ABSOLUTE_TTL_MS;
    if (Date.now() > absoluteDeadline) {
      await this.revokeFamily(token.familyId);
      this.clearCookies(res);
      throw new UnauthorizedException('Session has been revoked');
    }

    const user = await this.usersService.findById(token.userId);
    if (!user) {
      throw new UnauthorizedException('Unknown user');
    }

    // Rotate: revoke this token, issue a fresh refresh token in the same family.
    await this.refreshRepo.update(token.id, { revokedAt: new Date() });
    const newValue = randomBytes(32).toString('base64url');
    await this.refreshRepo.save(
      this.refreshRepo.create({
        userId: user.id,
        tokenHash: this.hash(newValue),
        familyId: token.familyId,
        deviceHash: this.hash(deviceFp),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      })
    );

    const access = await this.makeAccessToken({ id: user.id, email: user.email, role: user.role });
    this.setCookies(res, access, newValue);
    return { ok: true, expiresIn: Math.round(ACCESS_TTL_MS / 1000) };
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<{ success: boolean }> {
    const value = readCookie(req, REFRESH_COOKIE);
    if (value) {
      const token = await this.refreshRepo.findOne({ where: { tokenHash: this.hash(value) } });
      if (token) {
        await this.revokeFamily(token.familyId);
      }
    }
    this.clearCookies(res);
    return { success: true };
  }

  async me(req: AuthenticatedRequest, userId: string): Promise<AuthSession> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Unknown user');
    }

    let expiresIn = Math.round(ACCESS_TTL_MS / 1000);
    const accessValue = readCookie(req, ACCESS_COOKIE);
    if (accessValue) {
      try {
        const { payload } = await jwtVerify(accessValue, this.secret(), { algorithms: ['HS256'] });
        if (payload.exp) {
          expiresIn = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
        }
      } catch {
        // Access expired/malformed: the interceptor will refresh; report full TTL.
      }
    }

    return { id: user.id, email: user.email, role: user.role, expiresIn };
  }

  async getAllowlist(): Promise<AllowedEmail[]> {
    return this.allowRepo.find({ order: { createdAt: 'ASC' } });
  }

  async addToAllowlist(emailRaw: string, note?: string): Promise<AllowedEmail> {
    const email = this.normalizeEmail(emailRaw);
    if (!email) {
      throw new BadRequestException('Enter a valid email address');
    }
    const existing = await this.allowRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('That email is already on the list');
    }
    return this.allowRepo.save(this.allowRepo.create({ email, note: note || null }));
  }

  async removeFromAllowlist(emailRaw: string): Promise<{ success: boolean }> {
    const email = this.normalizeEmail(emailRaw);
    if (email === this.superadminEmail()) {
      throw new BadRequestException("You can't remove the superadmin from the list");
    }
    await this.allowRepo.delete({ email });
    return { success: true };
  }

  private async isAllowed(email: string): Promise<boolean> {
    if (email === this.superadminEmail()) return true;
    return !!(await this.allowRepo.findOne({ where: { email } }));
  }

  private async makeAccessToken(user: SessionUser): Promise<string> {
    return new SignJWT({ email: user.email, role: user.role, type: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + ACCESS_TTL_MS / 1000)
      .sign(this.secret());
  }

  private setCookies(res: Response, access: string, refresh: string): void {
    res.cookie(ACCESS_COOKIE, access, this.cookieOptions(ACCESS_TTL_MS));
    res.cookie(REFRESH_COOKIE, refresh, this.cookieOptions(REFRESH_TTL_MS));
  }

  private clearCookies(res: Response): void {
    res.clearCookie(ACCESS_COOKIE, this.cookieOptions(0));
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions(0));
  }

  // __Host- cookies must always be Secure, Path=/ and without Domain.
  private cookieOptions(maxAge: number) {
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'strict' as const,
      path: '/',
      maxAge,
    };
  }

  private async revokeFamily(familyId: string): Promise<void> {
    const members = await this.refreshRepo.find({ where: { familyId } });
    if (members.length > 0) {
      await this.refreshRepo.update(members.map((m) => m.id), { revokedAt: new Date() });
    }
  }

  private async pruneRefreshTokens(): Promise<void> {
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

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private secret(): Uint8Array {
    return new TextEncoder().encode(process.env.AUTH_JWT_SECRET || '');
  }

  private normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  private superadminEmail(): string {
    return (process.env.SUPERADMIN_EMAIL || '').toLowerCase().trim();
  }

  private passRateLimit(key: string, store: Map<string, number[]>, max: number): boolean {
    const now = Date.now();
    const recent = (store.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
    if (recent.length >= max) {
      return false;
    }
    recent.push(now);
    store.set(key, recent);
    return true;
  }
}