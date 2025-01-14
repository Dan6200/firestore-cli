//cspell:disable
import { Options } from "commander";
import { existsSync } from "fs";
import { resolve } from "path";
import { ENV_INFO } from "./auth/file-paths.mjs";
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
  try {
    if (!projectId) {
      ({
        default: { projectId },
      } = await import(resolve(ENV_INFO), {
        assert: { type: "json" },
      }));
      if (projectId)
        throw new Error(
          "Need to set project with the `set-project` command or include `project-id` as argument"
        );
    }
    const keyFile = options.overwriteKey
      ? handleAuthFile("Service Account")
      : undefined;
    if (keyFile && existsSync(keyFile) && !options.overwriteKey) {
      CLI_LOG(
        "Service Account key exists. Use the --overwrite-key flag to overwrite it.",
        "error"
      );
      throw new Error();
    }
    const authClient = await oAuth2();
    await enableIAMAPI(authClient, await parentProjectId, true);
    const serviceAccountName = await createServiceAccount(
      authClient,
      projectId
    );
    await createServiceAccountKey(authClient, serviceAccountName, keyFile);
  } catch (e) {
    CLI_LOG(
      `Failed to create service account and service account key for project: ${projectId}: ` +
        e,
      "error"
    );
  }
}
