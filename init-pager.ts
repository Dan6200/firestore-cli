import { spawn } from "child_process";

// TODO: Allow users to specify their own pager
const pager = spawn("less", ["-R"], { stdio: ["pipe", "inherit", "inherit"] });
let failedToStartPager = false;
pager.on("error", () => {
  failedToStartPager = true;
  console.error(
    "Could not find less installed on your system. Printing directly to stdout instead\n"
  );
});

pager.on("close", (code) => {
  if (code !== 0) {
    console.error("Pager process ended unexpectedly.");
  }
});

export { pager, failedToStartPager };
