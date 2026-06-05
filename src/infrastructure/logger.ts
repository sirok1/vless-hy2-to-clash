type LogLevel = "info" | "warn" | "error";

const LEVELS: Record<LogLevel, string> = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
};

interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string, error?: Error) => void;
}

function createLogger(scope = "App"): Logger {
  const format = (level: LogLevel, message: string, error?: Error): string => {
    const timestamp = new Date().toISOString();
    const suffix = error ? `\n${error.stack ?? error.message}` : "";
    return `${timestamp} [${scope}] ${LEVELS[level]} ${message}${suffix}`;
  };

  return {
    info(message) {
      console.log(format("info", message));
    },
    warn(message) {
      console.warn(format("warn", message));
    },
    error(message, error) {
      console.error(format("error", message, error));
    },
  };
}

export { createLogger };
export type { Logger };
