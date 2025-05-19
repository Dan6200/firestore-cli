//cspell:disable
import { Options } from "commander";
import { existsSync } from "fs";
import { resolve } from "path";
import { ENV_INFO } from "./auth/file-paths.mjs";
import { oAuth2 } from "./auth/oauth2.mjs";
import parentProjectId from "./auth/parent-project-id.mjs";
import { serviceAccountAuth } from "./auth/service-account.mjs";
import { handleAuthFile } from "./utils/auth.mjs";
import { CLI_LOG } from "./utils/logging.mjs";
import { enableIAMAPI } from "./utils/google-cloud-api-config/enable-api/iam.mjs";
import { JWT, OAuth2Client } from "google-auth-library";
import { createServiceAccountKey } from "./utils/google-cloud-api-config/service-accounts/create-key.mjs";
import { createServiceAccount } from "./utils/google-cloud-api-config/service-accounts/create.mjs";

export async function createServiceAccountWithKey(
  projectId: string,
  options: Options
) {
  const { serviceAccount } = options;
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
    const authClient = await (serviceAccount
      ? serviceAccountAuth(serviceAccount)
      : oAuth2(options));
    await enableIAMAPI(
      authClient as OAuth2Client | JWT,
      await parentProjectId(),
      true
    );
    const serviceAccountName = await createServiceAccount(
      authClient as OAuth2Client | JWT,
      projectId
    );
    await createServiceAccountKey(
      authClient as OAuth2Client | JWT,
      serviceAccountName,
      keyFile
    );
  } catch (e) {
    CLI_LOG(
      `Failed to create service account and service account key for project: ${projectId}: ` +
        e,
      "error"
    );
  }
}
