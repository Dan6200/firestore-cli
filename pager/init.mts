import { spawn, type ChildProcess } from "node:child_process";
import { Options } from "commander";
import { CLI_LOG } from "../utils/logging.mjs";

let pager: ChildProcess | null = null;
let failedToStartPager = false;

export function initializePager({ pager: pagerOption, pagerArgs }: Options) {
  if (typeof pagerOption === "boolean") failedToStartPager = true;
  else {
    pager = spawn(pagerOption, pagerArgs, {
      stdio: ["pipe", process.stdout, process.stderr],
    });
    pager.on("error", () => {
      failedToStartPager = true;
      CLI_LOG(
        `Could not find ${pagerOption} installed on your system. Printing directly to stdout instead\n`,
        "error",
      );
    });

    pager.on("close", (code: number) => {
      if (code !== 0 && !failedToStartPager) {
        CLI_LOG("Pager process ended unexpectedly.", "error");
      }
    });
  }

  return { pager, failedToStartPager };
}
