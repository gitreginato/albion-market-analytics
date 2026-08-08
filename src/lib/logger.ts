// Structured logger for production observability.
// Emits JSON lines with a correlation id and timestamp.

const isDev = process.env.NODE_ENV !== "production";

interface LogContext extends Record<string, unknown> {
  correlationId?: string;
}

function buildLogLine(
  level: string,
  message: string,
  context?: LogContext,
  error?: Error,
): string {
  const payload: Record<string, unknown> = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ?? {}),
  };
  if (error) {
    payload.errorName = error.name;
    payload.errorMessage = error.message;
    if (isDev) payload.stack = error.stack;
  }
  return JSON.stringify(payload);
}

export function info(message: string, context?: LogContext): void {
  console.log(buildLogLine("info", message, context));
}

export function warn(message: string, context?: LogContext, error?: Error): void {
  console.warn(buildLogLine("warn", message, context, error));
}

export function error(message: string, context?: LogContext, err?: Error): void {
  console.error(buildLogLine("error", message, context, err));
}

export function debug(message: string, context?: LogContext): void {
  if (isDev) {
    console.log(buildLogLine("debug", message, context));
  }
}
