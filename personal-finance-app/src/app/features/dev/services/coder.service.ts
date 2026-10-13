import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/* ---------- OpenCode wire types (defensive, pass-through) ---------- */

export interface CoderTime {
  created: number;
  updated: number;
}

export interface CoderSession {
  id: string;
  title?: string | null;
  time: CoderTime;
  parentID?: string | null;
  version: number;
  agent?: string | null;
  model?: string | null;
  dir?: string;
}

export interface CoderPart {
  id: string;
  type: string;
  text?: string;
  title?: string;
  name?: string;
  uri?: string;
  state?: string;
  tool?: string;
  input?: any;
  output?: any;
  metadata?: any;
  hide?: boolean;
  [k: string]: any;
}

export interface CoderMessage {
  id: string;
  parts: CoderPart[];
  [k: string]: any;
}

export interface CoderFieldDiff {
  key: string;
  value: any;
}

export interface CoderBlockDiff {
  content: string;
  addedLines: number[];
  removedLines: number[];
  type: 'added' | 'removed' | 'context';
}

export interface CoderFileDiff {
  path: string;
  newPath?: string;
  status?: string;
  added: number;
  removed: number;
  chunks: CoderBlockDiff[];
}

export interface CoderTodo {
  id?: string;
  content: string;
  status: 'pending' | 'completed' | 'in-progress' | string;
  pending?: boolean;
}

export interface CoderFileNode {
  name: string;
  path: string;
  fullPath?: string;
  type: 'file' | 'directory';
  size?: number;
}

export interface CoderFileContent {
  path: string;
  content: string;
  language?: string;
}

export interface CoderFileStatus {
  path: string;
  status: string;
  [k: string]: any;
}

export interface CoderVcs {
  current?: string;
  repo?: any;
  [k: string]: any;
}

export interface CoderPermission {
  id: string;
  type: string;
  request?: boolean;
  description?: string;
  inputs?: any;
  state?: string;
}

@Injectable({ providedIn: 'root' })
export class CoderService {
  private http = inject(HttpClient);
  private readonly base = '/api/coder';

  health(): Observable<{ healthy: boolean; version?: string }> {
    return this.http.get<{ healthy: boolean; version?: string }>(this.base + '/health');
  }

  vcs(): Observable<CoderVcs> {
    return this.http.get<CoderVcs>(this.base + '/vcs');
  }

  configProviders(): Observable<any> {
    return this.http.get<any>(this.base + '/config/providers');
  }

  sessions(): Observable<CoderSession[]> {
    return this.http.get<CoderSession[]>(this.base + '/session');
  }

  createSession(): Observable<CoderSession> {
    return this.http.post<CoderSession>(this.base + '/session', {});
  }

  deleteSession(id: string): Observable<unknown> {
    return this.http.delete(this.base + '/session/' + encodeURIComponent(id));
  }

  messages(id: string): Observable<CoderMessage[]> {
    return this.http.get<CoderMessage[]>(this.base + '/session/' + encodeURIComponent(id) + '/message');
  }

  promptAsync(id: string, text: string, model?: string): Observable<unknown> {
    const body: any = { parts: [{ type: 'text', text }] };
    if (model && model.trim()) body.model = model.trim();
    return this.http.post(this.base + '/session/' + encodeURIComponent(id) + '/prompt_async', body);
  }

  abort(id: string): Observable<unknown> {
    return this.http.post(this.base + '/session/' + encodeURIComponent(id) + '/abort', {});
  }

  respondPermission(
    id: string,
    permissionID: string,
    response: string,
    remember?: boolean
  ): Observable<unknown> {
    const body: any = { response };
    if (remember !== undefined) body.remember = remember;
    return this.http.post(
      this.base + '/session/' + encodeURIComponent(id) + '/permissions/' + encodeURIComponent(permissionID),
      body
    );
  }

  todo(id: string): Observable<CoderTodo[]> {
    return this.http.get<CoderTodo[]>(this.base + '/session/' + encodeURIComponent(id) + '/todo');
  }

  diff(id: string): Observable<CoderFileDiff[]> {
    return this.http.get<CoderFileDiff[]>(this.base + '/session/' + encodeURIComponent(id) + '/diff');
  }

  file(path: string): Observable<CoderFileNode[]> {
    return this.http.get<CoderFileNode[]>(this.base + '/file', { params: { path } });
  }

  fileContent(path: string): Observable<CoderFileContent> {
    return this.http.get<CoderFileContent>(this.base + '/file/content', { params: { path } });
  }

  fileStatus(): Observable<CoderFileStatus[]> {
    return this.http.get<CoderFileStatus[]>(this.base + '/file/status');
  }

  eventSource(): EventSource {
    return new EventSource(this.base + '/event');
  }
}