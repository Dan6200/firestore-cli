import { existsSync, mkdirSync } from "fs";
import {
  APP_CONFIG_DIR,
  CREDENTIALS,
  SERVICE_ACCOUNT,
} from "./auth/file-paths.mjs";
import { CLI_LOG } from "./utils/logging.mjs";

export function init() {
  const directories = [APP_CONFIG_DIR, CREDENTIALS, SERVICE_ACCOUNT];
  try {
    directories.forEach((dir) => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        CLI_LOG(`Created directory: ${dir}`, "log");
      }
    });
  } catch (err) {
    CLI_LOG(`Error initializing firestore-cli: ` + err, "error");
  }
}
