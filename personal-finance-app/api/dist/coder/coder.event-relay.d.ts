import { OnModuleDestroy } from '@nestjs/common';
import { Observable } from 'rxjs';
interface SseEvent {
    id?: string;
    type?: string;
    data: string;
    retry?: number;
}
export declare class CoderEventRelay implements OnModuleDestroy {
    private readonly logger;
    private readonly subject;
    private controller;
    private reconnectTimer;
    private stopped;
    stream(): Observable<SseEvent>;
    private ensure;
    private connect;
    private readStream;
    private scheduleReconnect;
    onModuleDestroy(): void;
}
export {};
