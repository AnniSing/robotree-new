export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  actor?: string;
  ip?: string;
  userAgent?: string;
  details?: unknown;
}

function sanitizeLogData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeLogData);

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lower = key.toLowerCase();
    if (
      lower.includes('password') ||
      lower.includes('secret') ||
      lower.includes('token') ||
      lower.includes('passcode') ||
      lower.includes('cookie') ||
      lower.includes('authorization')
    ) {
      clean[key] = '[REDACTED]';
    } else {
      clean[key] = sanitizeLogData(value);
    }
  }
  return clean;
}

export class Logger {
  public static log(level: LogLevel, message: string, meta: Partial<StructuredLog> = {}): void {
    const entry: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };
    if (meta.details) {
      entry.details = sanitizeLogData(meta.details);
    }
    const json = JSON.stringify(entry);
    if (level === 'error') {
      console.error(json);
    } else if (level === 'warn') {
      console.warn(json);
    } else {
      console.log(json);
    }
  }

  public static info(message: string, meta: Partial<StructuredLog> = {}): void {
    this.log('info', message, meta);
  }

  public static warn(message: string, meta: Partial<StructuredLog> = {}): void {
    this.log('warn', message, meta);
  }

  public static error(message: string, meta: Partial<StructuredLog> = {}): void {
    this.log('error', message, meta);
  }

  public static debug(message: string, meta: Partial<StructuredLog> = {}): void {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, meta);
    }
  }
}
