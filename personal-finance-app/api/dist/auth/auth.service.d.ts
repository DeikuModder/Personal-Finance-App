import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { OtpCode } from './otp-code.entity';
import { RefreshToken } from './refresh-token.entity';
import { AllowedEmail } from './allowed-email.entity';
import { MailService } from './mail.service';
import { UsersService } from '../users/users.service';
import type { AuthenticatedRequest } from './jwt-auth.guard';
export interface SessionUser {
    id: string;
    email: string;
    role: string;
}
export interface AuthSession extends SessionUser {
    expiresIn: number;
}
export declare class AuthService implements OnModuleInit, OnModuleDestroy {
    private readonly otpRepo;
    private readonly refreshRepo;
    private readonly allowRepo;
    private readonly usersService;
    private readonly mail;
    private readonly logger;
    private emailRequests;
    private ipRequests;
    private cooldowns;
    private gcTimer;
    constructor(otpRepo: Repository<OtpCode>, refreshRepo: Repository<RefreshToken>, allowRepo: Repository<AllowedEmail>, usersService: UsersService, mail: MailService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    requestOtp(emailRaw: string, ip: string): Promise<{
        success: boolean;
        reason?: string;
    }>;
    verifyOtp(emailRaw: string, code: string): Promise<SessionUser>;
    issueSession(req: AuthenticatedRequest, res: Response, user: SessionUser): Promise<AuthSession>;
    refresh(req: AuthenticatedRequest, res: Response): Promise<{
        ok: boolean;
        expiresIn: number;
    }>;
    logout(req: AuthenticatedRequest, res: Response): Promise<{
        success: boolean;
    }>;
    me(req: AuthenticatedRequest, userId: string): Promise<AuthSession>;
    getAllowlist(): Promise<AllowedEmail[]>;
    addToAllowlist(emailRaw: string, note?: string): Promise<AllowedEmail>;
    removeFromAllowlist(emailRaw: string): Promise<{
        success: boolean;
    }>;
    private isAllowed;
    private makeAccessToken;
    private setCookies;
    private clearCookies;
    private cookieOptions;
    private revokeFamily;
    private pruneRefreshTokens;
    private hash;
    private secret;
    private normalizeEmail;
    private superadminEmail;
    private passRateLimit;
}
