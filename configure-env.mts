import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import {
  APP_CONFIG_DIR,
  CREDENTIALS,
  SERVICE_ACCOUNT,
} from "./auth/file-paths.mjs";
import { CLI_LOG } from "./utils/logging.mjs";

export async function configureEnv() {
  const directories = [APP_CONFIG_DIR, CREDENTIALS, SERVICE_ACCOUNT];
  let alreadyInit = true;
  try {
    directories.forEach((dir) => {
      if (!existsSync(dir)) {
        mkdir(dir, { recursive: true });
        if (alreadyInit) alreadyInit = false;
      }
    });
    if (!alreadyInit) {
      CLI_LOG(`Successfully configured environment.`);
      CLI_LOG(
        `If you have not already, get your OAuth2 Credentials JSON file from the Google Cloud Console or with the \`gcloud\` CLI tool.\nSee docs for more: https://github.com/Dan6200/firestore-cli/blob/main/README.md.`
      );
      return;
    } else CLI_LOG(`Environment already configured.`);
  } catch (err) {
    CLI_LOG(`Error initializing firestore-cli.`, "error");
    process.exitCode = 1;
  }
}
