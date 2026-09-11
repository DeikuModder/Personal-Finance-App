import { AuthenticatedRequest } from './jwt-auth.guard';
export declare const ACCESS_COOKIE = "__Host-fintrack_access";
export declare const REFRESH_COOKIE = "__Host-fintrack_refresh";
export declare const DEVICE_COOKIE = "__Host-fintrack_device";
export declare function readCookie(req: AuthenticatedRequest, name: string): string | undefined;
