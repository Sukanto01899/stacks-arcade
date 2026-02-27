const noop = () => {};

// This is a stub for the pino logger, which is used in the game-frontend for logging. In a production environment, you would replace this with the actual pino logger, but for development and testing purposes, this stub allows you to avoid logging while still providing the same interface.
const logger = {
  level: "silent",
  fatal: noop,
  error: noop,
  warn: noop,
  info: noop,
  debug: noop,
  trace: noop,
  child: () => logger,
};

const pino = () => logger;

export default pino;
export { pino };
