import { Chalk } from "chalk";
const chalk = new Chalk({ level: 3 });

type LogLevel = "info" | "error" | "warn" | "log" | "debug";

export function CLI_LOG(
  obj: any,
  level?: LogLevel,
  tagOverride?: string,
  pager?: any,
) {
  switch (level) {
    case "error":
      if (pager) {
        pager.stdin.write(
          chalk.bgRed(` ${tagOverride || "ERROR"}: `) + chalk.red(` ${obj}`),
        );
        break;
      }
      console.error(
        chalk.bgRed(` ${tagOverride || "ERROR"}: `) + chalk.red(` ${obj}`),
      );
      break;
    case "warn":
      if (pager) {
        pager.stdin.write(
          chalk.bgYellow.black(` ${tagOverride || "WARN"}: `) +
            chalk.yellow(` ${obj}`),
        );
        break;
      }
      console.log(
        chalk.bgYellow.black(` ${tagOverride || "WARN"}: `) +
          chalk.yellow(` ${obj}`),
      );
      break;
    case "info":
      if (pager) {
        pager.stdin.write(
          chalk.bgWhite.black(` ${tagOverride || "INFO"}: `) +
            chalk.white(` ${obj}`),
        );
        break;
      }
      console.log(
        chalk.bgWhite.black(` ${tagOverride || "INFO"}: `) +
          chalk.white(` ${obj}`),
      );
      break;
    case "debug":
      if (pager) {
        pager.stdin.write(
          chalk.bgGray.black(` ${tagOverride || "DEBUG"}: `) +
            chalk.dim(` ${obj}`),
        );
        break;
      }
      console.debug(
        chalk.bgGray.black(` ${tagOverride || "DEBUG"}: `) +
          chalk.dim(` ${obj}`),
      );
      break;
    default:
      if (pager) {
        pager.stdin.write(
          chalk.bgGreen(` ${tagOverride || "LOG"}: `) + chalk.green(` ${obj}`),
        );
        break;
      }
      console.log(
        chalk.bgGreen(` ${tagOverride || "LOG"}: `) + chalk.green(` ${obj}`),
      );
      break;
  }
}
