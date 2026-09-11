import { Body, Controller, Delete, Get, Param, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService, AuthSession, SessionUser } from './auth.service';
import { AddAllowedEmailDto, RequestOtpDto, VerifyOtpDto } from './auth.dto';
import { AuthenticatedRequest } from './jwt-auth.guard';
import { Public, Roles, SUPERADMIN } from './auth.decorators';
import { AllowedEmail } from './allowed-email.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('request-otp')
  async requestOtp(
    @Body() dto: RequestOtpDto,
    @Req() req: AuthenticatedRequest
  ): Promise<{ success: boolean; reason?: string }> {
    return this.auth.requestOtp(dto.email, req.ip || '');
  }

  @Public()
  @Post('verify-otp')
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthSession> {
    const user = await this.auth.verifyOtp(dto.email, dto.code);
    return this.auth.issueSession(req, res, user);
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ ok: boolean; expiresIn: number }> {
    return this.auth.refresh(req, res);
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ success: boolean }> {
    return this.auth.logout(req, res);
  }

  @Get('me')
  async me(@Req() req: AuthenticatedRequest): Promise<AuthSession> {
    return this.auth.me(req, req.user!.userId);
  }

  @Get('allowlist')
  @Roles(SUPERADMIN)
  async getAllowlist(): Promise<AllowedEmail[]> {
    return this.auth.getAllowlist();
  }

  @Post('allowlist')
  @Roles(SUPERADMIN)
  async addToAllowlist(@Body() dto: AddAllowedEmailDto): Promise<AllowedEmail> {
    return this.auth.addToAllowlist(dto.email, dto.note);
  }

  @Delete('allowlist/:email')
  @Roles(SUPERADMIN)
  async removeFromAllowlist(@Param('email') email: string): Promise<{ success: boolean }> {
    return this.auth.removeFromAllowlist(email);
  }
}