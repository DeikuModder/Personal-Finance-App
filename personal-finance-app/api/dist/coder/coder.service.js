"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoderService = exports.CoderHttpError = void 0;
const common_1 = require("@nestjs/common");
class CoderHttpError extends common_1.HttpException {
    constructor(status, message) {
        super(message, status);
    }
}
exports.CoderHttpError = CoderHttpError;
let CoderService = class CoderService {
    constructor() {
        this.logger = new common_1.Logger('CoderService');
        const url = process.env.OPENCODE_SERVER_URL || 'http://localhost:4096';
        this.base = url.replace(/\/+$/, '');
        const user = process.env.OPENCODE_SERVER_USERNAME || 'opencode';
        const password = process.env.OPENCODE_SERVER_PASSWORD || 'opencode';
        this.auth = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64');
    }
    buildQuery(query) {
        if (!query)
            return '';
        const entries = Object.entries(query).filter(([, v]) => v !== undefined && v !== null);
        if (entries.length === 0)
            return '';
        const params = new URLSearchParams();
        for (const [k, v] of entries)
            params.set(k, String(v));
        return '?' + params.toString();
    }
    headers(extra) {
        return {
            Authorization: this.auth,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...extra,
        };
    }
    async get(path, query) {
        const res = await this.request('GET', path, query, undefined);
        if (res.status === 204)
            return null;
        return res.json().catch(() => null);
    }
    async mutate(method, path, body) {
        const res = await this.request(method, path, undefined, body === undefined ? {} : body);
        if (res.status === 204)
            return null;
        const text = await res.text();
        if (!text)
            return null;
        try {
            return JSON.parse(text);
        }
        catch {
            return text;
        }
    }
    async request(method, path, query, body) {
        const url = this.base + path + this.buildQuery(query);
        let res;
        try {
            res = await fetch(url, {
                method,
                headers: this.headers(),
                body: method !== 'GET' && body !== undefined ? JSON.stringify(body) : undefined,
                signal: AbortSignal.timeout(60000),
            });
        }
        catch (err) {
            this.logger.error(`OpenCode server unreachable at ${this.base}: ${err}`);
            throw new common_1.ServiceUnavailableException('OpenCode server is unreachable. Make sure the coder service is running.');
        }
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new CoderHttpError(res.status, text || `OpenCode upstream ${res.status}`);
        }
        return res;
    }
};
exports.CoderService = CoderService;
exports.CoderService = CoderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CoderService);
//# sourceMappingURL=coder.service.js.map