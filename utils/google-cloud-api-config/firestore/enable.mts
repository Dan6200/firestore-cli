import { OAuth2Client, JWT } from "google-auth-library";
import { Options } from "commander";
import { oAuth2 } from "../../../auth/oauth2.mjs";
import { enableFirestoreAPI } from "../enable-api/firestore.mjs";
import { createFirestoreDatabase } from "./create-database.mjs";
import { serviceAccountKeyAuth } from "../../../auth/service-account-key.mjs";
import { CLI_LOG } from "../../logging.mjs";

export async function enableFirestore(projectId: string, options: Options) {
  if (options.debug) {
    const params = { projectId, options };
    CLI_LOG(`Enabling Firestore...\n${params}`, "debug");
  }
  const { serviceAccountKey } = options;
  const oAuthClient = await (serviceAccountKey
    ? serviceAccountKeyAuth(serviceAccountKey)
    : oAuth2(options));
  const response = await enableFirestoreAPI(
    oAuthClient as OAuth2Client | JWT,
    projectId,
  );
  if (!response) return;
  return createFirestoreDatabase(
    oAuthClient as OAuth2Client | JWT,
    projectId,
    options,
  );
}
