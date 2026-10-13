import { HttpException } from '@nestjs/common';
type QueryParams = Record<string, string | number | boolean | undefined>;
export declare class CoderHttpError extends HttpException {
    constructor(status: number, message: string);
}
export declare class CoderService {
    private readonly logger;
    private readonly base;
    private readonly auth;
    constructor();
    private buildQuery;
    private headers;
    get(path: string, query?: QueryParams): Promise<any>;
    mutate(method: 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<any>;
    private request;
}
export {};
