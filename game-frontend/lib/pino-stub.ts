const noop = () => {};

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
