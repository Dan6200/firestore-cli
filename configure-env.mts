import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import {
  APP_CONFIG_DIR,
  CREDENTIALS,
  SERVICE_ACCOUNT_KEY,
} from "./auth/file-paths.mjs";
import { CLI_LOG } from "./utils/logging.mjs";
import { Options } from "commander";

export async function configureEnv({ debug }: Options) {
  let directories = [APP_CONFIG_DIR, CREDENTIALS, SERVICE_ACCOUNT_KEY];

  let alreadyConfigured = true;
  try {
    directories.forEach((dir) => {
      if (!existsSync(dir)) {
        mkdir(dir, { recursive: true });
        debug && CLI_LOG(`Successfully created: ${dir}`, "debug");
        // mark that the environment was not configured or not configured properly!
        if (alreadyConfigured) alreadyConfigured = false;
      }
    });
    if (!alreadyConfigured) {
      CLI_LOG(`Successfully configured environment.`);
      CLI_LOG(
        `Get your OAuth2 Credentials JSON file (Or Service Account Key) from the Google Cloud Console or with the \`gcloud\` CLI tool.\nThen move the file to ${directories[0]} \n\nSee docs for more: https://github.com/Dan6200/firestore-cli/blob/main/README.md.\nRun this command once more after that is completed.`,
        "info",
      );
      process.exit();
    }
    CLI_LOG(`Environment already configured.`);
    CLI_LOG(
      `If you have not already, get your OAuth2 Credentials JSON file (Or Service Account Key) from the Google Cloud Console or with the \`gcloud\` CLI tool.\nThen move the file to ${directories[0]}\n\nSee docs for more: https://github.com/Dan6200/firestore-cli/blob/main/README.md.`,
      "info",
    );
  } catch (err) {
    CLI_LOG(`Error configuring environment.`, "error");
    process.exit(1);
  }
}
