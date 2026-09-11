import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { jwtVerify, JWTPayload } from 'jose';
import { Request } from 'express';
import { UsersService } from '../users/users.service';
import { IS_PUBLIC_KEY } from './auth.decorators';
import { ACCESS_COOKIE, readCookie } from './cookie.util';

export interface AuthUser {
  email: string;
  userId: string;
  role: string;
  payload: JWTPayload;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const { payload } = await jwtVerify(token, this.secret(), { algorithms: ['HS256'] });
      const user = await this.usersService.findById(payload.sub as string);
      if (!user) {
        throw new UnauthorizedException('Unknown user');
      }
      request.user = {
        email: user.email,
        userId: user.id,
        role: user.role,
        payload,
      };
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired session');
    }
  }

  private secret(): Uint8Array {
    return new TextEncoder().encode(process.env.AUTH_JWT_SECRET || '');
  }

  private extractToken(request: AuthenticatedRequest): string | undefined {
    const auth = request.headers['authorization'];
    if (auth && auth.startsWith('Bearer ')) {
      return auth.slice(7);
    }
    return readCookie(request, ACCESS_COOKIE);
  }
}