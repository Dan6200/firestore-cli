//cspell:disable
import { Options } from "commander";
import { existsSync } from "fs";
import { oAuth2 } from "./auth/oauth2.mjs";
import parentProjectId from "./auth/parent-project-id.mjs";
import { handleAuthFile } from "./utils/auth.mjs";
import {
  createServiceAccount,
  createServiceAccountKey,
  enableIAMAPI,
} from "./utils/google-cloud-config.mjs";
import { CLI_LOG } from "./utils/logging.mjs";

export async function createServiceAccountWithKey(
  projectId: string,
  options: Options
) {
  const keyFile = options.overwrite
    ? handleAuthFile("Service Account")
    : undefined;
  if (keyFile && existsSync(keyFile) && !options.overwrite) {
    CLI_LOG(
      "Service Account key exists. Use the --overwrite flag to overwrite",
      "error"
    );
    throw new Error();
  }
  const authClient = await oAuth2();
  await enableIAMAPI(authClient, await parentProjectId, true);
  const serviceAccountName = await createServiceAccount(authClient, projectId);
  await createServiceAccountKey(authClient, serviceAccountName, keyFile);
}
