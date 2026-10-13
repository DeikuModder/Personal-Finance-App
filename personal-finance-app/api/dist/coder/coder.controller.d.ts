import { Observable } from 'rxjs';
import { CoderService } from './coder.service';
import { CoderEventRelay } from './coder.event-relay';
type QueryParams = Record<string, string | number | boolean | undefined>;
export declare class CoderController {
    private readonly coder;
    private readonly events;
    constructor(coder: CoderService, events: CoderEventRelay);
    health(): Promise<any>;
    project(): Promise<any>;
    projectCurrent(): Promise<any>;
    path(): Promise<any>;
    vcs(): Promise<any>;
    config(): Promise<any>;
    providers(): Promise<any>;
    sessions(): Promise<any>;
    createSession(body: {
        parentID?: string;
        title?: string;
    }): Promise<any>;
    session(id: string): Promise<any>;
    updateSession(id: string, body: {
        title?: string;
    }): Promise<any>;
    deleteSession(id: string): Promise<any>;
    todo(id: string): Promise<any>;
    diff(id: string, query: QueryParams): Promise<any>;
    abort(id: string): Promise<any>;
    command(id: string, body: {
        command: string;
        arguments?: any;
        agent?: string;
        model?: string;
    }): Promise<any>;
    shell(id: string, body: {
        command: string;
        agent?: string;
        model?: string;
    }): Promise<any>;
    messages(id: string, query: QueryParams): Promise<any>;
    sendMessage(id: string, body: any): Promise<any>;
    promptAsync(id: string, body: any): Promise<any>;
    respondPermission(id: string, permissionID: string, body: {
        response: string;
        remember?: boolean;
    }): Promise<any>;
    file(query: QueryParams): Promise<any>;
    fileContent(query: QueryParams): Promise<any>;
    fileStatus(): Promise<any>;
    find(query: QueryParams): Promise<any>;
    findFile(query: QueryParams): Promise<any>;
    eventStream(): Observable<{
        type?: string;
        data: string;
    }>;
}
export {};
