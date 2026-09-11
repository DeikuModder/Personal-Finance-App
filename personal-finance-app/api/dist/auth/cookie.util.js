"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEVICE_COOKIE = exports.REFRESH_COOKIE = exports.ACCESS_COOKIE = void 0;
exports.readCookie = readCookie;
exports.ACCESS_COOKIE = '__Host-fintrack_access';
exports.REFRESH_COOKIE = '__Host-fintrack_refresh';
exports.DEVICE_COOKIE = '__Host-fintrack_device';
function readCookie(req, name) {
    const header = req.headers.cookie;
    if (!header)
        return undefined;
    for (const part of header.split(';')) {
        const idx = part.indexOf('=');
        if (idx === -1)
            continue;
        const key = part.slice(0, idx).trim();
        const val = part.slice(idx + 1).trim();
        if (key === name)
            return decodeURIComponent(val);
    }
    return undefined;
}
//# sourceMappingURL=cookie.util.js.map