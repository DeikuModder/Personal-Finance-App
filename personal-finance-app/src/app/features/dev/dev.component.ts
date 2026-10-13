import { Component, OnDestroy, computed, effect, inject, signal, viewChild, ElementRef, NgZone } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import {
  CoderService,
  CoderSession,
  CoderMessage,
  CoderPart,
  CoderFileDiff,
  CoderTodo,
  CoderFileStatus,
  CoderFileNode,
  CoderFileContent,
} from './services/coder.service';

const MODEL_KEY = 'fintrack_dev_model';
const LAST_SESSION_KEY = 'fintrack_dev_last_session';

interface DevMessage {
  id: string;
  parts: CoderPart[];
}

type Badge = { kind: 'error' | 'info'; text: string };

type SideTab = 'diffs' | 'todo' | 'git' | 'files';

@Component({
  selector: 'app-dev',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, DatePipe],
  templateUrl: './dev.html',
  styleUrl: './dev.scss',
})
export class DevComponent implements OnDestroy {
  private coder = inject(CoderService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private zone = inject(NgZone);

  isSuperadmin = computed(() => this.auth.me()?.role === 'superadmin');

  sessions = signal<CoderSession[]>([]);
  activeId = signal<string | null>(null);
  messages = signal<DevMessage[]>([]);
  pendingPrompt = signal<string | null>(null);
  badges = signal<Badge[]>([]);

  running = signal(false);
  busy = signal(false);

  health = signal<{ healthy: boolean; version?: string } | null>(null);
  healthMsg = signal('checking…');

  input = signal('');
  model = signal(localStorage.getItem(MODEL_KEY) ?? '');
  permission = signal<{ sessionID: string; permissionID: string; type: string; description: string } | null>(null);

  sideTab = signal<SideTab>('diffs');
  diffs = signal<CoderFileDiff[]>([]);
  todos = signal<CoderTodo[]>([]);
  gitFiles = signal<CoderFileStatus[]>([]);
  branch = signal('');
  filePath = signal('.');
  fileNodes = signal<CoderFileNode[]>([]);
  fileOpen = signal<CoderFileContent | null>(null);
  filesLoading = signal(false);
  sideOpen = signal(true);

  private events: EventSource | null = null;
  private threadEl = viewChild<ElementRef<HTMLElement>>('thread');

  constructor() {
    if (!this.auth.me()?.role) {
      void this.auth.restoreSession().then(() => {
        if (this.auth.me()?.role !== 'superadmin') {
          void this.router.navigate(['/dashboard']);
        }
      });
    } else if (!this.isSuperadmin()) {
      void this.router.navigate(['/dashboard']);
    }

    this.refreshHealth();
    this.loadSessions();
    this.watchEvents();

    effect(() => {
      void this.messages();
      void this.pendingPrompt();
      void this.badges();
      void this.running();
      const el = this.threadEl()?.nativeElement;
      if (el) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
      }
    });
  }

  /* ------------------------------------------------------------ */
  /* Bootstrapping                                                */
  /* ------------------------------------------------------------ */

  refreshHealth(): void {
    this.healthMsg.set('checking…');
    this.coder.health().subscribe({
      next: (h) => {
        this.health.set(h);
        this.healthMsg.set(h.healthy ? `opencode ${h.version ?? ''}`.trim() : 'unhealthy');
      },
      error: () => {
        this.health.set(null);
        this.healthMsg.set('coder unreachable');
      },
    });
  }

  loadSessions(): void {
    this.coder.sessions().subscribe({
      next: (list) => {
        this.sessions.set(list.sort((a, b) => b.time.updated - a.time.updated));
        if (!this.activeId() && list.length > 0) {
          const last = localStorage.getItem(LAST_SESSION_KEY);
          const target = list.find((s) => s.id === last) ?? list[0];
          this.selectSession(target.id);
        } else if (this.activeId()) {
          const still = list.some((s) => s.id === this.activeId());
          if (!still) this.selectSession(null);
        }
      },
      error: (e) => this.pushBadge('error', this.friendly(e)),
    });
  }

  private watchEvents(): void {
    const es = this.coder.eventSource();
    this.events = es;

    const dispatch = (type: string, data: string) => {
      let payload: any;
      try {
        payload = JSON.parse(data);
      } catch {
        payload = { raw: data };
      }
      this.handlers(type, payload);
    };

    es.onopen = () => {
      this.zone.run(() => {
        this.refreshHealth();
        this.loadSessions();
        this.reloadSide(true);
      });
    };
    es.onerror = () => {
      this.zone.run(() => this.healthMsg.set('coder unreachable'));
    };
    const names = [
      'server.connected',
      'session.updated',
      'session.idle',
      'session.paused',
      'session.error',
      'message.new',
      'message.updated',
      'message.part.updated',
      'todo.updated',
      'permission.updated',
    ];
    for (const name of names) {
      es.addEventListener(name, (e) => {
        const ev = e as MessageEvent;
        if (this.zone) {
          this.zone.run(() => dispatch(name, String(ev.data ?? '')));
        } else {
          dispatch(name, String(ev.data ?? ''));
        }
      });
    }
  }

  private handlers(type: string, p: any): void {
    const props = p?.properties ?? p ?? {};
    const sid = props.sessionID ?? props.session?.id;
    const active = this.activeId();

    switch (type) {
      case 'session.updated': {
        const s = props.session ?? props;
        if (s && s.id) {
          this.sessions.update((list) => {
            const idx = list.findIndex((x) => x.id === s.id);
            if (idx >= 0) {
              const next = [...list];
              next[idx] = s;
              return next.sort((a, b) => b.time.updated - a.time.updated);
            }
            return [s, ...list].sort((a, b) => b.time.updated - a.time.updated);
          });
        }
        break;
      }
      case 'session.idle':
      case 'session.paused':
        if (sid === active) {
          this.running.set(false);
          this.pendingPrompt.set(null);
          this.reloadSide(true);
        }
        break;
      case 'session.error':
        if (sid === active || !sid) {
          this.running.set(false);
          this.pendingPrompt.set(null);
        }
        break;
      case 'message.new':
      case 'message.updated': {
        const mid = props.messageID ?? props.message?.id;
        if (sid === active && mid) this.ensureMessage(mid);
        break;
      }
      case 'message.part.updated': {
        const mid = props.messageID ?? props.message?.id;
        const part: CoderPart = props.part;
        if (sid === active && mid && part && part.id) {
          this.ensureMessage(mid);
          this.upsertPart(mid, part);
          if (part.type === 'user' && part.text) this.pendingPrompt.set(null);
          if (part.type === 'text' && part.text && this.pendingPrompt()) this.pendingPrompt.set(null);
        }
        break;
      }
      case 'todo.updated': {
        if (sid === active) {
          const todos = Array.isArray(props.todos)
            ? props.todos
            : Array.isArray(props)
              ? props
              : [];
          this.todos.set(todos);
        }
        break;
      }
      case 'permission.updated': {
        this.handlePermission(props);
        break;
      }
      case 'server.connected':
        break;
    }
  }

  private handlePermission(props: any): void {
    const sessionID = props.sessionID;
    if (sessionID !== this.activeId()) return;
    const perm = props.permission;
    if (!perm || !perm.id) return;
    const isRequest =
      props.kind === 'request' || perm.state === 'request' || perm.request === true;
    if (isRequest) {
      this.permission.set({
        sessionID,
        permissionID: props.permissionID ?? perm.id,
        type: perm.type ?? 'unknown',
        description: perm.description ?? perm.inputs?.description ?? '',
      });
    } else if (props.kind === 'fulfilled' || perm.state === 'allow' || perm.state === 'deny' || perm.request === false) {
      this.permission.set(null);
    }
  }

  private ensureMessage(mid: string): void {
    this.messages.update((list) =>
      list.some((m) => m.id === mid) ? list : [...list, { id: mid, parts: [] }]
    );
  }

  private upsertPart(mid: string, part: CoderPart): void {
    this.messages.update((list) =>
      list.map((m) => {
        if (m.id !== mid) return m;
        const idx = m.parts.findIndex((x) => x.id === part.id);
        if (idx >= 0) {
          const parts = [...m.parts];
          parts[idx] = part;
          return { ...m, parts };
        }
        return { ...m, parts: [...m.parts, part] };
      })
    );
  }

  /* ------------------------------------------------------------ */
  /* Sessions                                                     */
  /* ------------------------------------------------------------ */

  selectSession(id: string | null): void {
    this.activeId.set(id);
    this.messages.set([]);
    this.pendingPrompt.set(null);
    this.permission.set(null);
    this.running.set(false);
    this.diffs.set([]);
    this.todos.set([]);
    this.gitFiles.set([]);
    this.fileOpen.set(null);
    if (id) {
      localStorage.setItem(LAST_SESSION_KEY, id);
      this.loadMessages(id);
      this.reloadSide();
    }
  }

  newSession(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.coder.createSession().subscribe({
      next: (s) => {
        this.busy.set(false);
        this.sessions.update((list) => [s, ...list]);
        this.selectSession(s.id);
      },
      error: (e) => {
        this.busy.set(false);
        this.pushBadge('error', this.friendly(e));
      },
    });
  }

  deleteSession(id: string): void {
    const wasActive = this.activeId() === id;
    this.coder.deleteSession(id).subscribe({
      next: () => {
        const next = this.sessions().filter((s) => s.id !== id);
        this.sessions.set(next);
        if (wasActive) this.selectSession(next[0]?.id ?? null);
        if (id === localStorage.getItem(LAST_SESSION_KEY)) localStorage.removeItem(LAST_SESSION_KEY);
      },
      error: (e) => this.pushBadge('error', this.friendly(e)),
    });
  }

  sessionTitle(s: CoderSession): string {
    return s.title?.trim() || 'Untitled';
  }

  private loadMessages(id: string): void {
    this.coder.messages(id).subscribe({
      next: (list) => this.messages.set(list.map((m) => ({ id: m.id, parts: m.parts ?? [] }))),
      error: (e) => this.pushBadge('error', this.friendly(e)),
    });
  }

  /* ------------------------------------------------------------ */
  /* Chat                                                         */
  /* ------------------------------------------------------------ */

  get canSend(): boolean {
    return !!this.activeId() && !this.running() && this.input().trim().length > 0;
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    const id = this.activeId();
    const text = this.input().trim();
    if (!id || !text || this.running()) return;
    this.input.set('');
    this.pendingPrompt.set(text);
    this.running.set(true);
    localStorage.setItem(MODEL_KEY, this.model().trim());
    this.coder.promptAsync(id, text, this.model()).subscribe({
      next: () => undefined,
      error: (e) => {
        this.running.set(false);
        this.pendingPrompt.set(null);
        this.pushBadge('error', this.friendly(e));
      },
    });
  }

  abort(): void {
    const id = this.activeId();
    if (!id) return;
    this.running.set(false);
    this.coder.abort(id).subscribe({ error: () => undefined });
  }

  respondPermission(allow: boolean, remember: boolean): void {
    const p = this.permission();
    if (!p) return;
    this.permission.set(null);
    this.coder
      .respondPermission(p.sessionID, p.permissionID, allow ? 'allow' : 'deny', remember)
      .subscribe({ error: (e) => this.pushBadge('error', this.friendly(e)) });
  }

  private pushBadge(kind: 'error' | 'info', text: string): void {
    this.badges.update((list) => [...list.slice(-19), { kind, text }]);
  }

  friendly(e: any): string {
    if (!e) return 'Request failed';
    const msg = e.error?.message ?? e.error ?? e.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.map((m: any) => m?.message ?? String(m)).join('; ');
    try {
      return typeof msg === 'object' ? JSON.stringify(msg).slice(0, 500) : String(msg);
    } catch {
      return 'Request failed';
    }
  }

  /* ------------------------------------------------------------ */
  /* Part rendering helpers                                       */
  /* ------------------------------------------------------------ */

  snippet(v: any): string {
    if (v === undefined || v === null) return '';
    if (typeof v === 'string') return v.length > 600 ? v.slice(0, 600) + '…' : v;
    try {
      const s = JSON.stringify(v);
      return s.length > 600 ? s.slice(0, 600) + '…' : s;
    } catch {
      return String(v);
    }
  }

  toolLabel(part: CoderPart): string {
    if (part.title) return part.title;
    const input = part.input;
    if (input && typeof input === 'object' && input.description) return input.description;
    return part.tool ?? part.type;
  }

  partError(part: CoderPart): boolean {
    return part.state === 'error' || part.state === 'aborted';
  }

  partDone(part: CoderPart): boolean {
    return part.state === 'completed' || part.state === 'done';
  }

  /* ------------------------------------------------------------ */
  /* Side panel                                                   */
  /* ------------------------------------------------------------ */

  openTab(tab: SideTab): void {
    this.sideTab.set(tab);
    this.reloadSide();
  }

  reloadSide(force = false): void {
    const id = this.activeId();
    if (!id && this.sideTab() !== 'files') {
      this.diffs.set([]);
      this.todos.set([]);
      return;
    }
    switch (this.sideTab()) {
      case 'diffs':
        if (id) {
          this.coder.diff(id).subscribe({
            next: (d) => this.diffs.set(d ?? []),
            error: (e) => this.diffs.set([]),
          });
        }
        break;
      case 'todo':
        if (id) {
          this.coder.todo(id).subscribe({
            next: (t) => this.todos.set(Array.isArray(t) ? t : []),
            error: () => this.todos.set([]),
          });
        }
        break;
      case 'git':
        void force;
        this.coder
          .vcs()
          .subscribe({
            next: (v) => this.branch.set(v?.current ?? ''),
            error: () => undefined,
          });
        this.coder.fileStatus().subscribe({
          next: (f) => this.gitFiles.set(f ?? []),
          error: (e) => this.gitFiles.set([]),
        });
        break;
      case 'files':
        this.loadFileDir(this.filePath());
        break;
    }
  }

  loadFileDir(path: string): void {
    this.filesLoading.set(true);
    this.fileOpen.set(null);
    this.coder.file(path).subscribe({
      next: (nodes) => {
        this.filePath.set(path);
        this.fileNodes.set(nodes ?? []);
        this.filesLoading.set(false);
      },
      error: (e) => {
        this.filesLoading.set(false);
        this.fileNodes.set([]);
        this.pushBadge('error', this.friendly(e));
      },
    });
  }

  openFileNode(node: CoderFileNode): void {
    if (node.type === 'directory') {
      this.loadFileDir(node.path || node.fullPath || '.');
    } else {
      this.filesLoading.set(true);
      this.coder.fileContent(node.path || node.fullPath || '').subscribe({
        next: (c) => {
          this.fileOpen.set(c);
          this.filesLoading.set(false);
        },
        error: (e) => {
          this.filesLoading.set(false);
          this.pushBadge('error', this.friendly(e));
        },
      });
    }
  }

  goUpDir(): void {
    const parts = this.filePath().split('/').filter(Boolean);
    parts.pop();
    this.loadFileDir(parts.length ? parts.join('/') : '.');
  }

  fileCrumbs(): string[] {
    const p = this.filePath();
    if (p === '.' || p === '') return ['workspace'];
    return ['workspace', ...p.split('/').filter(Boolean)];
  }

  diffLines(chunk: any): { text: string; cls: string }[] {
    const content: string = chunk?.content ?? '';
    return content
      .split('\n')
      .filter((l: string) => l.includes('|') || /^[+\-@ ]/.test(l))
      .map((line: string) => {
        const c = line[0] ?? '';
        const cls = c === '+' ? 'added' : c === '-' ? 'removed' : 'context';
        return { text: line, cls };
      });
  }

  todoStatus(t: CoderTodo): 'done' | 'current' | 'pending' {
    if (t.status === 'completed') return 'done';
    if (t.status === 'in-progress') return 'current';
    return 'pending';
  }

  statusMark(status: string): string {
    const s = String(status || '').slice(0, 1).toUpperCase();
    return s || '?';
  }

  statusClass(status: string): string {
    const s = String(status || '').replace(' ', '_');
    if (s.startsWith('A') || s.startsWith('M')) return 'add';
    if (s.startsWith('D')) return 'rm';
    return 'mod';
  }

  toggleSide(): void {
    this.sideOpen.update((v) => !v);
  }

  ngOnDestroy(): void {
    if (this.events) this.events.close();
  }
}