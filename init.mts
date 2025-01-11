import { existsSync, mkdirSync } from "fs";
import {
  APP_CONFIG_DIR,
  CREDENTIALS,
  SERVICE_ACCOUNT,
} from "./auth/file-paths.mjs";
import { CLI_LOG } from "./utils/logging.mjs";

export async function init() {
  const directories = [APP_CONFIG_DIR, CREDENTIALS, SERVICE_ACCOUNT];
  let alreadyInit = true;
  try {
    directories.forEach((dir) => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        if (alreadyInit) alreadyInit = false;
      }
    });
    if (!alreadyInit) CLI_LOG(`Successfully configured environment.`);
    else CLI_LOG(`Environment already configured.`);
  } catch (err) {
    CLI_LOG(`Error initializing firestore-cli.`, "error");
  }
}
