import { Response } from 'express';
import { AuthService, SessionUser } from './auth.service';
import { AddAllowedEmailDto, RequestOtpDto, VerifyOtpDto } from './auth.dto';
import { AuthenticatedRequest } from './jwt-auth.guard';
import { AllowedEmail } from './allowed-email.entity';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    requestOtp(dto: RequestOtpDto, req: AuthenticatedRequest): Promise<{
        success: boolean;
        reason?: string;
    }>;
    verifyOtp(dto: VerifyOtpDto, res: Response): Promise<SessionUser>;
    refresh(req: AuthenticatedRequest, res: Response): Promise<{
        ok: boolean;
    }>;
    logout(req: AuthenticatedRequest, res: Response): Promise<{
        success: boolean;
    }>;
    me(req: AuthenticatedRequest): Promise<SessionUser>;
    getAllowlist(): Promise<AllowedEmail[]>;
    addToAllowlist(dto: AddAllowedEmailDto): Promise<AllowedEmail>;
    removeFromAllowlist(email: string): Promise<{
        success: boolean;
    }>;
}
