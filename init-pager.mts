import { spawn } from "child_process";
import { Options } from "commander";
import { program } from "./commands.mjs";
import { CLI_LOG } from "./utils/logging.mjs";

let pager: any = null;
let failedToStartPager = false;

export function initializePager({ pager: pagerOption }: Options) {
  if (typeof pagerOption === "boolean") failedToStartPager = true;
  else {
    pager = spawn(pagerOption, program.opts().pagerArgs, {
      stdio: ["pipe", "inherit", "inherit"],
    });
    pager.on("error", () => {
      failedToStartPager = true;
      CLI_LOG(
        `Could not find ${pagerOption} installed on your system. Printing directly to stdout instead\n`,
        "error"
      );
    });

    pager.on("close", (code: number) => {
      if (code !== 0 && !failedToStartPager) {
        console.error("Pager process ended unexpectedly.");
      }
    });
  }

  return { pager, failedToStartPager };
}
