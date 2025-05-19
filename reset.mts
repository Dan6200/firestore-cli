import { existsSync } from "fs";
import { rmdir } from "fs/promises";
import { APP_CONFIG_DIR } from "./auth/file-paths.mjs";
import { CLI_LOG } from "./utils/logging.mjs";

export async function resetEnv() {
  try {
    if (existsSync(APP_CONFIG_DIR)) {
      rmdir(APP_CONFIG_DIR, { recursive: true });
    }
    CLI_LOG(`Successfully reset environment.`);
    return;
  } catch (err) {
    CLI_LOG(`Error resetting environment.`, "error");
    process.exit(1);
  }
}
