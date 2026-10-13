import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

interface SseEvent {
  id?: string;
  type?: string;
  data: string;
  retry?: number;
}

const DEFAULT_RECONNECT_MS = 2000;

@Injectable()
export class CoderEventRelay implements OnModuleDestroy {
  private readonly logger = new Logger('CoderEvent');
  private readonly subject = new Subject<SseEvent>();
  private controller: AbortController | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  stream(): Observable<SseEvent> {
    this.ensure();
    return this.subject.asObservable();
  }

  private ensure(): void {
    if (this.controller || this.stopped) return;
    this.connect();
  }

  private connect(): void {
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
      } catch (err) {
        if (this.stopped) return;
        if (signal.aborted) return;
        this.logger.warn(`OpenCode event stream error: ${err}`);
      } finally {
        this.controller = null;
        this.scheduleReconnect();
      }
    })();
  }

  private async readStream(body: ReadableStream<Uint8Array>, signal: AbortSignal): Promise<void> {
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
        if (signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (line === '') {
            flush();
          } else if (line.startsWith('event:')) {
            type = line.slice('event:'.length).trim();
          } else if (line.startsWith('data:')) {
            data += (data ? '\n' : '') + line.slice('data:'.length).trim();
          } else if (line.startsWith(':')) {
            // SSE keep-alive comment
          }
        }
      }
    } finally {
      flush();
      reader.releaseLock();
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.stopped) return;
      this.connect();
    }, DEFAULT_RECONNECT_MS);
  }

  onModuleDestroy(): void {
    this.stopped = true;
    if (this.controller) this.controller.abort();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.subject.complete();
  }
}