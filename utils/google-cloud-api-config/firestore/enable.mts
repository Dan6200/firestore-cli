import { OAuth2Client, JWT } from "google-auth-library";
import { Options } from "commander";
import { oAuth2 } from "../../../auth/oauth2.mjs";
import { enableFirestoreAPI } from "../enable-api/firestore.mjs";
import { createFirestoreDatabase } from "./create-database.mjs";
import { serviceAccountAuth } from "../../../auth/service-account.mjs";

export async function enableFirestore(projectId: string, options: Options) {
  const { serviceAccount } = options;
  const oAuthClient = await (serviceAccount
    ? serviceAccountAuth(serviceAccount)
    : oAuth2(options));
  const response = await enableFirestoreAPI(
    oAuthClient as OAuth2Client | JWT,
    projectId
  );
  if (!response) return;
  return createFirestoreDatabase(
    oAuthClient as OAuth2Client | JWT,
    projectId,
    options
  );
}
