import { Chalk } from "chalk";
const chalk = new Chalk({ level: 3 });

type LogLevel = "info" | "error";

export function CLI_LOG(obj: any, level?: LogLevel) {
  switch (level) {
    case "error":
      console.error(chalk.bgRed(" ERROR: ") + chalk.red(` ${obj}`));
      break;
    case "info":
      console.log(chalk.bgWhite.black(" INFO: ") + chalk.white(` ${obj}`));
      break;
    default:
      console.log(chalk.bgGreen(" LOG: ") + chalk.green(` ${obj}`));
      break;
  }
}
