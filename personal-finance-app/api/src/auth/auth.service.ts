import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes, randomInt } from 'crypto';
import { SignJWT } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { OtpCode } from './otp-code.entity';
import { RefreshToken } from './refresh-token.entity';
import { AllowedEmail } from './allowed-email.entity';
import { MailService } from './mail.service';
import { UsersService } from '../users/users.service';
import { SUPERADMIN } from './auth.decorators';
import { readCookie } from './cookie.util';
import type { AuthenticatedRequest } from './jwt-auth.guard';

export interface SessionUser {
  id: string;
  email: string;
  role: string;
}

const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const EMAIL_RATE_MAX = 4;
const IP_RATE_MAX = 8;
const RATE_WINDOW_MS = 10 * 60 * 1000;

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private emailRequests = new Map<string, number[]>();
  private ipRequests = new Map<string, number[]>();
  private cooldowns = new Map<string, number>();

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

  async issueSession(res: Response, user: SessionUser): Promise<void> {
    const access = await this.makeAccessToken(user);
    const refreshValue = randomBytes(32).toString('base64url');
    await this.refreshRepo.save(
      this.refreshRepo.create({
        userId: user.id,
        tokenHash: this.hash(refreshValue),
        familyId: uuidv4(),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      })
    );
    this.setCookies(res, access, refreshValue);
  }

  async refresh(req: AuthenticatedRequest, res: Response): Promise<{ ok: boolean }> {
    const value = readCookie(req, 'ft_refresh');
    if (!value) {
      throw new UnauthorizedException('No refresh token');
    }
    const token = await this.refreshRepo.findOne({ where: { tokenHash: this.hash(value) } });
    if (!token) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (token.revokedAt || token.expiresAt.getTime() < Date.now()) {
      // Reuse of a revoked token -> revoke the whole family.
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
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      })
    );

    const access = await this.makeAccessToken({ id: user.id, email: user.email, role: user.role });
    this.setCookies(res, access, newValue);
    return { ok: true };
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<{ success: boolean }> {
    const value = readCookie(req, 'ft_refresh');
    if (value) {
      const token = await this.refreshRepo.findOne({ where: { tokenHash: this.hash(value) } });
      if (token) {
        await this.revokeFamily(token.familyId);
      }
    }
    this.clearCookies(res);
    return { success: true };
  }

  async me(userId: string): Promise<SessionUser> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Unknown user');
    }
    return { id: user.id, email: user.email, role: user.role };
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
    res.cookie('ft_access', access, this.cookieOptions(ACCESS_TTL_MS));
    res.cookie('ft_refresh', refresh, this.cookieOptions(REFRESH_TTL_MS));
  }

  private clearCookies(res: Response): void {
    res.clearCookie('ft_access', this.cookieOptions(0));
    res.clearCookie('ft_refresh', this.cookieOptions(0));
  }

  private cookieOptions(maxAge: number) {
    const secure = process.env.COOKIE_SECURE !== 'false';
    return {
      httpOnly: true,
      secure,
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