import { spawn } from "child_process";

const less = spawn("less", ["-R"], { stdio: ["pipe", "inherit", "inherit"] });
let failedToStartLess = false;
less.on("error", () => {
  failedToStartLess = true;
  console.error(
    "Could not find less installed on your system. Printing directly to stdout instead\n"
  );
});

less.on("close", (code) => {
  if (code !== 0) {
    console.error("Less process ended unexpectedly.");
  }
});

export { less, failedToStartLess };
