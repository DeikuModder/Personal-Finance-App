import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscriber, map } from 'rxjs';

export interface AiPendingWrite {
  id: string;
  action: string;
  echo: string;
  text: string;
}

export interface AiReply {
  reply: string;
  pendingWrite: AiPendingWrite | null;
}

export type AiStreamEvent =
  | { type: 'token'; text: string }
  | { type: 'reply'; text: string; pendingWrite: AiPendingWrite | null }
  | { type: 'error'; text: string }
  | { type: 'done' };

interface AiChatResponse {
  reply: string;
  pending_write: AiPendingWrite | null;
}

@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  private http = inject(HttpClient);
  private readonly baseUrlKey = 'fintrack_ai_base_url';
  private readonly defaultBaseUrl = 'http://localhost:8200';
  private baseUrl = localStorage.getItem(this.baseUrlKey) ?? this.defaultBaseUrl;

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(value: string): void {
    const trimmed = value.trim().replace(/\/+$/, '');
    this.baseUrl = trimmed || this.defaultBaseUrl;
    localStorage.setItem(this.baseUrlKey, this.baseUrl);
  }

  health(): Observable<{ status: string; timestamp: string }> {
    return this.http.get<{ status: string; timestamp: string }>(`${this.baseUrl}/health`);
  }

  send(text: string, conversationId: string): Observable<AiReply> {
    return this.http
      .post<AiChatResponse>(`${this.baseUrl}/chat`, {
        text,
        conversation_id: conversationId,
      })
      .pipe(map((r) => this.mapReply(r)));
  }

  stream(text: string, conversationId: string): Observable<AiStreamEvent> {
    const controller = new AbortController();
    return new Observable<AiStreamEvent>((subscriber) => {
      const run = async (): Promise<void> => {
        try {
          const response = await fetch(`${this.baseUrl}/chat/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, conversation_id: conversationId }),
            signal: controller.signal,
          });
          if (!response.ok || !response.body) {
            subscriber.next({ type: 'error', text: `Assistant responded with HTTP ${response.status}.` });
            subscriber.complete();
            return;
          }
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let newline: number;
            while ((newline = buffer.indexOf('\n')) >= 0) {
              const line = buffer.slice(0, newline).trim();
              buffer = buffer.slice(newline + 1);
              if (!line.startsWith('data:')) continue;
              const payload = line.slice(5).trim();
              if (!payload) continue;
              try {
                this.emitStreamEvent(JSON.parse(payload), subscriber);
              } catch {
                // ignore malformed events
              }
            }
          }
          subscriber.complete();
        } catch {
          if (controller.signal.aborted) {
            subscriber.complete();
            return;
          }
          subscriber.next({
            type: 'error',
            text: 'Could not reach the AI assistant. Make sure EV is running and allows this origin (CORS).',
          });
          subscriber.complete();
        }
      };
      void run();
      return () => controller.abort();
    });
  }

  confirm(conversationId: string, accepted: boolean): Observable<AiReply> {
    return this.http
      .post<AiChatResponse>(
        `${this.baseUrl}/chat/${encodeURIComponent(conversationId)}/confirm`,
        { accepted }
      )
      .pipe(map((r) => this.mapReply(r)));
  }

  reset(conversationId: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(
      `${this.baseUrl}/reset/${encodeURIComponent(conversationId)}`,
      {}
    );
  }

  private mapReply(r: AiChatResponse): AiReply {
    return { reply: r.reply, pendingWrite: r.pending_write };
  }

  private emitStreamEvent(evt: Record<string, unknown>, subscriber: Subscriber<AiStreamEvent>): void {
    switch (evt['type']) {
      case 'token':
        subscriber.next({ type: 'token', text: String(evt['text'] ?? '') });
        break;
      case 'reply':
        subscriber.next({
          type: 'reply',
          text: String(evt['text'] ?? ''),
          pendingWrite: (evt['pending_write'] as AiPendingWrite | null) ?? null,
        });
        break;
      case 'error':
        subscriber.next({ type: 'error', text: String(evt['text'] ?? 'Assistant reported an error.') });
        break;
      case 'done':
        subscriber.next({ type: 'done' });
        break;
    }
  }
}