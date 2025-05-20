import { existsSync, statSync } from "fs";
import { google } from "googleapis";
import { handleAuthFile } from "../utils/auth.mjs";
import { CLI_LOG } from "../utils/logging.mjs";
import { SCOPES } from "./scopes.mjs";

/**
 * For Authenticating with service account key instead of oAuth2 credentials
 */
export async function serviceAccountKeyAuth(saPath: string) {
  const keyFile = handleAuthFile("Service Account Key", saPath);
  if (!existsSync(keyFile) || statSync(keyFile).isDirectory()) {
    throw new Error(`Service account key file is invalid: ${keyFile}`);
  }
  let auth;
  try {
    auth = new google.auth.GoogleAuth({
      keyFile,
      scopes: [SCOPES[1]],
    });
  } catch (e) {
    CLI_LOG("Failed Google authentication: " + e, "error");
    throw e;
  }
  let authClient;
  try {
    authClient = await auth.getClient();
  } catch (e) {
    throw new Error("Failed to retrieve auth client:\n" + e);
  }
  return authClient;
}
