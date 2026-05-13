// GAS の Logger 相当。タイムスタンプ + レベル付きで stderr に出す。
// 本文は stdout に出すので、CLI 出力を redirect しても汚染されない。

type Level = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function ts(): string {
  return new Date().toISOString();
}

function emit(level: Level, ...args: unknown[]): void {
  const prefix = `[${ts()}] [${level}]`;
  console.error(prefix, ...args);
}

export const Logger = {
  info: (...args: unknown[]) => emit('INFO', ...args),
  warn: (...args: unknown[]) => emit('WARN', ...args),
  error: (...args: unknown[]) => emit('ERROR', ...args),
  debug: (...args: unknown[]) => {
    if (process.env.DEBUG) emit('DEBUG', ...args);
  },
};
