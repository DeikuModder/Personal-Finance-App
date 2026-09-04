import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { Request } from 'express';
import { UsersService } from '../users/users.service';
import { SKIP_CF_AUTH } from './auth.decorators';

export interface AuthUser {
  email: string;
  userId: string;
  payload: JWTPayload;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

@Injectable()
export class CfAccessGuard implements CanActivate {
  private jwks?: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly usersService: UsersService,
    private readonly reflector: Reflector
  ) {}

  private get teamDomain(): string {
    return (process.env.CF_TEAM_DOMAIN || '').replace(/\/+$/, '');
  }

  private get aud(): string {
    return process.env.CF_AUD || '';
  }

  private getJwks(): ReturnType<typeof createRemoteJWKSet> {
    if (!this.jwks) {
      this.jwks = createRemoteJWKSet(
        new URL(`${this.teamDomain}/cdn-cgi/access/certs`)
      );
    }
    return this.jwks;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CF_AUTH, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return true;
    }

    if (!this.teamDomain || !this.aud) {
      throw new UnauthorizedException('CF_TEAM_DOMAIN and CF_AUD are required');
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.headers['cf-access-jwt-assertion'] as string | undefined;

    if (!token) {
      throw new UnauthorizedException('Missing Cloudflare Access token');
    }

    try {
      const { payload } = await jwtVerify(token, this.getJwks(), {
        issuer: this.teamDomain,
        audience: this.aud,
      });

      const email =
        (payload.email as string) ||
        (payload.identity as string) ||
        (payload.sub as string);

      if (!email) {
        throw new UnauthorizedException('No identity in token');
      }

      const user = await this.usersService.resolveByEmail(email);

      const authUser: AuthUser = {
        email,
        userId: user.id,
        payload,
      };

      request.user = authUser;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid Cloudflare Access token');
    }
  }
}
