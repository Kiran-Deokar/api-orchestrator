import type { LogEntry, LogLevel, LoggerConfig } from './types';
import { redactSensitive } from './utils';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

export class Logger {
  private level: LogLevel;
  private customLogger?: (entry: LogEntry) => void;
  private redactKeys: string[];
  private history: LogEntry[] = [];
  private historySize: number;

  constructor(config: LoggerConfig = {}) {
    this.level = config.level ?? 'warn';
    this.customLogger = config.logger;
    this.redactKeys = config.redactKeys ?? [];
    this.historySize = config.historySize ?? 0;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.level];
  }

  private pushHistory(entry: LogEntry): void {
    if (this.historySize <= 0) return;
    this.history.push(entry);
    if (this.history.length > this.historySize) {
      this.history.shift();
    }
  }

  log(entry: LogEntry): void {
    try {
      if (!this.shouldLog(entry.level)) return;

      const safeEntry: LogEntry = {
        ...entry,
        meta: entry.meta
          ? (redactSensitive(entry.meta as Record<string, unknown>, this.redactKeys) as Record<string, unknown>)
          : undefined,
      };

      this.pushHistory(safeEntry);

      if (this.customLogger) {
        this.customLogger(safeEntry);
        return;
      }

      // Default console logging
      const prefix = `[api-orchestrator] [${safeEntry.level.toUpperCase()}] ${safeEntry.method} ${safeEntry.url}`;
      const details = {
        id: safeEntry.id,
        status: safeEntry.status,
        duration: safeEntry.duration ? `${safeEntry.duration}ms` : undefined,
        outcome: safeEntry.outcome,
        errorCode: safeEntry.errorCode,
        retry: safeEntry.retryAttempt,
      };

      switch (safeEntry.level) {
        case 'debug':
          console.debug(prefix, details);
          break;
        case 'info':
          console.info(prefix, details);
          break;
        case 'warn':
          console.warn(prefix, details);
          break;
        case 'error':
          console.error(prefix, details, safeEntry.message);
          break;
      }
    } catch {
      // Logger failures must never affect the request
    }
  }

  getHistory(): readonly LogEntry[] {
    return this.history;
  }

  clearHistory(): void {
    this.history = [];
  }
}
