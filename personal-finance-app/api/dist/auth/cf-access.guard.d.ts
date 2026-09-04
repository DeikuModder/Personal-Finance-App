import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JWTPayload } from 'jose';
import { Request } from 'express';
import { UsersService } from '../users/users.service';
export interface AuthUser {
    email: string;
    userId: string;
    payload: JWTPayload;
}
export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}
export declare class CfAccessGuard implements CanActivate {
    private readonly usersService;
    private readonly reflector;
    private jwks?;
    constructor(usersService: UsersService, reflector: Reflector);
    private get teamDomain();
    private get aud();
    private getJwks;
    canActivate(context: ExecutionContext): Promise<boolean>;
}
