import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  HttpException,
} from '@nestjs/common';

type QueryParams = Record<string, string | number | boolean | undefined>;

export class CoderHttpError extends HttpException {
  constructor(status: number, message: string) {
    super(message, status);
  }
}

@Injectable()
export class CoderService {
  private readonly logger = new Logger('CoderService');
  private readonly base: string;
  private readonly auth: string;

  constructor() {
    const url = process.env.OPENCODE_SERVER_URL || 'http://localhost:4096';
    this.base = url.replace(/\/+$/, '');
    const user = process.env.OPENCODE_SERVER_USERNAME || 'opencode';
    const password = process.env.OPENCODE_SERVER_PASSWORD || 'opencode';
    this.auth = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64');
  }

  private buildQuery(query?: QueryParams): string {
    if (!query) return '';
    const entries = Object.entries(query).filter(
      ([, v]) => v !== undefined && v !== null
    );
    if (entries.length === 0) return '';
    const params = new URLSearchParams();
    for (const [k, v] of entries) params.set(k, String(v));
    return '?' + params.toString();
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    return {
      Authorization: this.auth,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...extra,
    };
  }

  async get(path: string, query?: QueryParams): Promise<any> {
    const res = await this.request('GET', path, query, undefined);
    if (res.status === 204) return null;
    return res.json().catch(() => null);
  }

  async mutate(
    method: 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<any> {
    const res = await this.request(method, path, undefined, body === undefined ? {} : body);
    if (res.status === 204) return null;
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private async request(
    method: string,
    path: string,
    query?: QueryParams,
    body?: unknown
  ): Promise<Response> {
    const url = this.base + path + this.buildQuery(query);
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: this.headers(),
        body: method !== 'GET' && body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(60000),
      });
    } catch (err) {
      this.logger.error(`OpenCode server unreachable at ${this.base}: ${err}`);
      throw new ServiceUnavailableException(
        'OpenCode server is unreachable. Make sure the coder service is running.'
      );
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new CoderHttpError(res.status, text || `OpenCode upstream ${res.status}`);
    }
    return res;
  }
}