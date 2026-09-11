import { AuthenticatedRequest } from './jwt-auth.guard';
export declare function readCookie(req: AuthenticatedRequest, name: string): string | undefined;
