import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JWTPayload } from 'jose';
import { Request } from 'express';
import { UsersService } from '../users/users.service';
export interface AuthUser {
    email: string;
    userId: string;
    role: string;
    payload: JWTPayload;
}
export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}
export declare class JwtAuthGuard implements CanActivate {
    private readonly usersService;
    private readonly reflector;
    constructor(usersService: UsersService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private secret;
    private extractToken;
}
