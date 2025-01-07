import { Chalk } from "chalk";
const chalk = new Chalk({ level: 3 });

type LogLevel = "info" | "log" | "error";

export function CLI_LOG(str: string, level: LogLevel = "info") {
  switch (level) {
    case "error":
      console.error(chalk.bgRed(" ERROR: ") + chalk.red(` ${str}`));
      break;
    case "log":
      console.log(chalk.bgGreen(" LOG: ") + chalk.green(` ${str}`));
      break;
    case "info":
    default:
      console.log(chalk.bgWhite.black(" INFO: ") + chalk.white(` ${str}`));
      break;
  }
}
