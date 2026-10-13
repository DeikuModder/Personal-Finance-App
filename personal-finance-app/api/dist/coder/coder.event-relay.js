"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoderEventRelay = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const DEFAULT_RECONNECT_MS = 2000;
let CoderEventRelay = class CoderEventRelay {
    constructor() {
        this.logger = new common_1.Logger('CoderEvent');
        this.subject = new rxjs_1.Subject();
        this.controller = null;
        this.reconnectTimer = null;
        this.stopped = false;
    }
    stream() {
        this.ensure();
        return this.subject.asObservable();
    }
    ensure() {
        if (this.controller || this.stopped)
            return;
        this.connect();
    }
    connect() {
        const url = (process.env.OPENCODE_SERVER_URL || 'http://localhost:4096').replace(/\/+$/, '');
        const user = process.env.OPENCODE_SERVER_USERNAME || 'opencode';
        const password = process.env.OPENCODE_SERVER_PASSWORD || 'opencode';
        const auth = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64');
        this.controller = new AbortController();
        const signal = this.controller.signal;
        (async () => {
            try {
                const res = await fetch(url + '/event', {
                    headers: { Authorization: auth, Accept: 'text/event-stream' },
                    signal,
                });
                if (!res.ok || !res.body) {
                    throw new Error(`upstream /event returned ${res.status}`);
                }
                await this.readStream(res.body, signal);
            }
            catch (err) {
                if (this.stopped)
                    return;
                if (signal.aborted)
                    return;
                this.logger.warn(`OpenCode event stream error: ${err}`);
            }
            finally {
                this.controller = null;
                this.scheduleReconnect();
            }
        })();
    }
    async readStream(body, signal) {
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let type = '';
        let data = '';
        const flush = () => {
            if (data) {
                this.subject.next({ type: type || undefined, data });
                type = '';
                data = '';
            }
        };
        try {
            for (;;) {
                if (signal.aborted)
                    break;
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const raw of lines) {
                    const line = raw.trim();
                    if (line === '') {
                        flush();
                    }
                    else if (line.startsWith('event:')) {
                        type = line.slice('event:'.length).trim();
                    }
                    else if (line.startsWith('data:')) {
                        data += (data ? '\n' : '') + line.slice('data:'.length).trim();
                    }
                    else if (line.startsWith(':')) {
                    }
                }
            }
        }
        finally {
            flush();
            reader.releaseLock();
        }
    }
    scheduleReconnect() {
        if (this.stopped)
            return;
        if (this.reconnectTimer)
            return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.stopped)
                return;
            this.connect();
        }, DEFAULT_RECONNECT_MS);
    }
    onModuleDestroy() {
        this.stopped = true;
        if (this.controller)
            this.controller.abort();
        if (this.reconnectTimer)
            clearTimeout(this.reconnectTimer);
        this.subject.complete();
    }
};
exports.CoderEventRelay = CoderEventRelay;
exports.CoderEventRelay = CoderEventRelay = __decorate([
    (0, common_1.Injectable)()
], CoderEventRelay);
//# sourceMappingURL=coder.event-relay.js.map