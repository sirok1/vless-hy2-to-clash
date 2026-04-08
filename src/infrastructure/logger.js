const LEVELS = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR"
};

function createLogger(scope = "App") {
  const format = (level, message, error) => {
    const timestamp = new Date().toISOString();
    const suffix = error ? `\n${error.stack || error.message}` : "";
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
    }
  };
}

module.exports = {
  createLogger
};
