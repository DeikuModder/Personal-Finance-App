import { Component, ElementRef, inject, signal, viewChild, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AiAssistantService, AiPendingWrite } from './services/ai-assistant.service';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
  pendingWrite?: AiPendingWrite | null;
  streaming?: boolean;
}

const STORAGE_KEY = 'fintrack_ai_messages';
const CONVERSATION_KEY = 'fintrack_ai_conversation';
const MAX_MESSAGES = 100;
const MAX_TEXT = 4000;

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class ChatComponent implements OnDestroy {
  private ai = inject(AiAssistantService);
  private thread = viewChild.required<ElementRef<HTMLElement>>('thread');

  readonly MAX_TEXT = MAX_TEXT;

  messages = signal<ChatMessage[]>([]);
  input = signal('');
  sending = signal(false);
  conversationId: string;

  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private scrollTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.conversationId = localStorage.getItem(CONVERSATION_KEY) ?? uuidv4();
    localStorage.setItem(CONVERSATION_KEY, this.conversationId);
    this.messages.set(this.loadMessages());
    this.scrollToBottom(true);
  }

  get baseUrl(): string {
    return this.ai.getBaseUrl();
  }

  get canSend(): boolean {
    return this.input().trim().length > 0 && this.input().length <= MAX_TEXT && !this.sending();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    const text = this.input().trim();
    if (!text || this.sending() || text.length > MAX_TEXT) return;

    this.input.set('');
    this.messages.update((m) => [...m, { id: uuidv4(), role: 'user', text }]);
    this.persistSoon();
    this.scrollToBottom();

    const placeholderId = uuidv4();
    this.messages.update((m) => [
      ...m,
      { id: placeholderId, role: 'assistant', text: '', streaming: true },
    ]);
    this.sending.set(true);

    let terminal = false;
    this.ai.stream(text, this.conversationId).subscribe({
      next: (event) => {
        switch (event.type) {
          case 'token':
            if (terminal) return;
            this.messages.update((m) =>
              m.map((msg) =>
                msg.id === placeholderId ? { ...msg, text: msg.text + event.text } : msg
              )
            );
            break;
          case 'reply':
            terminal = true;
            this.messages.update((m) =>
              m.map((msg) =>
                msg.id === placeholderId
                  ? { ...msg, text: event.text, pendingWrite: event.pendingWrite, streaming: false }
                  : msg
              )
            );
            break;
          case 'error':
            terminal = true;
            this.messages.update((m) =>
              m.map((msg) =>
                msg.id === placeholderId
                  ? { ...msg, role: 'error', text: event.text, streaming: false }
                  : msg
              )
            );
            break;
          case 'done':
            break;
        }
        this.persistSoon();
        this.scrollToBottom();
      },
      error: () => {
        this.messages.update((m) =>
          m.map((msg) => {
            if (msg.id !== placeholderId) return msg;
            const fallback =
              'Could not reach the AI assistant. Make sure EV is running and allows this origin (CORS).';
            const text = msg.text.trim() ? `${msg.text.trim()}\n— connection closed.` : fallback;
            return { ...msg, role: 'error', text, streaming: false };
          })
        );
        this.sending.set(false);
        this.persist();
        this.scrollToBottom();
      },
      complete: () => {
        this.sending.set(false);
        this.persist();
      },
    });
  }

  get pendingAction(): AiPendingWrite | null {
    for (let i = this.messages().length - 1; i >= 0; i--) {
      const msg = this.messages()[i];
      if (msg.role === 'assistant' && msg.pendingWrite) return msg.pendingWrite;
    }
    return null;
  }

  confirmPending(accepted: boolean): void {
    if (this.sending() || !this.pendingAction) return;
    const id = this.pendingAction.id;
    this.messages.update((m) =>
      m.map((msg) => (msg.pendingWrite?.id === id ? { ...msg, pendingWrite: null } : msg))
    );
    this.sending.set(true);

    this.ai.confirm(this.conversationId, accepted).subscribe({
      next: (reply) => {
        this.messages.update((m) => [
          ...m,
          { id: uuidv4(), role: 'assistant', text: reply.reply, pendingWrite: reply.pendingWrite },
        ]);
      },
      error: () => {
        this.messages.update((m) => [
          ...m,
          {
            id: uuidv4(),
            role: 'error',
            text: 'Could not confirm the action with the assistant.',
          },
        ]);
      },
      complete: () => {
        this.sending.set(false);
        this.persist();
        this.scrollToBottom();
      },
    });
  }

  newChat(): void {
    this.ai.reset(this.conversationId).subscribe({
      error: () => undefined,
    });
    this.conversationId = uuidv4();
    localStorage.setItem(CONVERSATION_KEY, this.conversationId);
    this.messages.set([]);
    this.persist();
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  ngOnDestroy(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
    this.persist();
  }

  private loadMessages(): ChatMessage[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ChatMessage[];
      return Array.isArray(parsed) ? parsed.slice(-MAX_MESSAGES) : [];
    } catch {
      return [];
    }
  }

  private persistSoon(): void {
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => this.persist(), 400);
  }

  private persist(): void {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages().slice(-MAX_MESSAGES)));
    } catch {
      // storage unavailable — ignore
    }
  }

  private scrollToBottom(force = false): void {
    const el = this.thread()?.nativeElement;
    if (!el) return;
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => {
      if (!force) {
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        if (!nearBottom) return;
      }
      el.scrollTop = el.scrollHeight;
    }, 0);
  }
}