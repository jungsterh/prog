import type { LogLevel } from './config/config.js';

/** Port for structured logging. Callers must never pass secrets or request bodies. */
export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
}

export type LogFields = Readonly<Record<string, string | number | boolean | undefined>>;

const LEVEL_ORDER: Readonly<Record<LogLevel, number>> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export type LogSink = (line: string) => void;

/** JSON-lines logger. Writes to stderr by default so that stdout stays free. */
export function createJsonLogger(
  minLevel: LogLevel,
  sink: LogSink = (line) => process.stderr.write(`${line}\n`),
  now: () => Date = () => new Date(),
): Logger {
  const write = (level: LogLevel, message: string, fields: LogFields = {}): void => {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;
    sink(JSON.stringify({ time: now().toISOString(), level, message, ...fields }));
  };
  const at =
    (level: LogLevel) =>
    (message: string, fields?: LogFields): void => {
      write(level, message, fields);
    };
  return { debug: at('debug'), info: at('info'), warn: at('warn'), error: at('error') };
}

export const silentLogger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};
