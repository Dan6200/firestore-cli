import chalk from "chalk";
import { CLI_LOG } from "./logging.mjs";

export const permissionDeniedError = (error: Error) =>
  CLI_LOG(
    `${error.message.replace(/^(.*): /, "").replace(/project ([\w-]+)/, (_: string, p1: string) => `project ${chalk.bgRed.white.bold(p1)}`)}\n`,
    "error",
    "PERMISSION DENIED",
  );
