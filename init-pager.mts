import { spawn } from "child_process";
import { program } from "./commands.mjs";

let pager = null;
let failedToStartPager = false;

export function initializePager() {
  const usersPager: string = program.opts().pager;
  if (usersPager?.toUpperCase() === "NONE") failedToStartPager = true;
  else {
    if (usersPager)
      pager = spawn(usersPager, program.opts().pagerArgs, {
        stdio: ["pipe", "inherit", "inherit"],
      });
    else
      pager = spawn(process.env.PAGER, {
        stdio: ["pipe", "inherit", "inherit"],
      });
    pager.on("error", () => {
      failedToStartPager = true;
      console.error(
        "Could not find less installed on your system. Printing directly to stdout instead\n"
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