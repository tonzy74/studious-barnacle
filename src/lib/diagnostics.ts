/**
 * On-device diagnostics log.
 *
 * A small in-memory ring buffer that records what the app actually does at
 * runtime — barcode resolutions, AI calls, and errors — so issues can be seen
 * and shared (Settings → Diagnostics → Share) instead of guessed at. It holds
 * technical data only (bottle names, sources, error messages) — no account
 * info, no API key.
 */

export type DiagLevel = 'info' | 'warn' | 'error';

export interface DiagEntry {
  at: number;
  level: DiagLevel;
  tag: string;
  message: string;
}

const MAX = 200;
const buffer: DiagEntry[] = [];
const listeners = new Set<() => void>();

function push(level: DiagLevel, tag: string, message: string) {
  buffer.push({ at: Date.now(), level, tag, message: message.slice(0, 500) });
  if (buffer.length > MAX) buffer.splice(0, buffer.length - MAX);
  listeners.forEach((l) => l());
}

export const diag = {
  info: (tag: string, message: string) => push('info', tag, message),
  warn: (tag: string, message: string) => push('warn', tag, message),
  error: (tag: string, err: unknown, context = '') => {
    const status = (err as { status?: number })?.status;
    const msg = err instanceof Error ? err.message : String(err);
    push('error', tag, `${context ? context + ' — ' : ''}${status ? `[${status}] ` : ''}${msg}`);
  },
};

export function getLog(): DiagEntry[] {
  return [...buffer].reverse(); // newest first
}

export function clearLog() {
  buffer.length = 0;
  listeners.forEach((l) => l());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Plain-text dump for sharing. */
export function formatLog(): string {
  if (buffer.length === 0) return 'Whiskey Vault diagnostics — no entries yet.';
  const lines = getLog().map((e) => {
    const t = new Date(e.at).toISOString().slice(11, 19);
    return `${t} ${e.level.toUpperCase().padEnd(5)} [${e.tag}] ${e.message}`;
  });
  return `Whiskey Vault diagnostics (${buffer.length})\n\n${lines.join('\n')}`;
}
