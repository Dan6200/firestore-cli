import { Chalk } from "chalk";
const chalk = new Chalk({ level: 3 });

type LogLevel = "info" | "error";

export function CLI_LOG(obj: any, level?: LogLevel, pager?: any) {
  switch (level) {
    case "error":
      if (pager) {
        pager.stdin.write(chalk.bgRed(" ERROR: ") + chalk.red(` ${obj}`));
        break;
      }
      console.error(chalk.bgRed(" ERROR: ") + chalk.red(` ${obj}`));
      break;
    case "info":
      if (pager) {
        pager.stdin.write(
          chalk.bgWhite.black(" INFO: ") + chalk.white(` ${obj}`)
        );
        break;
      }
      console.log(chalk.bgWhite.black(" INFO: ") + chalk.white(` ${obj}`));
      break;
    default:
      if (pager) {
        pager.stdin.write(chalk.bgGreen(" LOG: ") + chalk.green(` ${obj}`));
        break;
      }
      console.log(chalk.bgGreen(" LOG: ") + chalk.green(` ${obj}`));
      break;
  }
}
