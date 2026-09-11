import { AuthenticatedRequest } from './jwt-auth.guard';

export const ACCESS_COOKIE = '__Host-fintrack_access';
export const REFRESH_COOKIE = '__Host-fintrack_refresh';
export const DEVICE_COOKIE = '__Host-fintrack_device';

export function readCookie(req: AuthenticatedRequest, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key === name) return decodeURIComponent(val);
  }
  return undefined;
}