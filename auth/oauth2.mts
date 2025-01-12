import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import { createInterface } from "readline/promises";
import { resolve } from "path";
import { TOKEN_PATH } from "./file-paths.mjs";
import { CLI_LOG } from "../utils/logging.mjs";
import { handleAuthFile } from "../utils/auth.mjs";

const SCOPES = [
  "https://www.googleapis.com/auth/datastore",
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/cloud-billing",
  "https://www.googleapis.com/auth/devstorage.read_write",
];

// Load client secrets from a local file
export async function oAuth2(credentialsPath?: string) {
  const { default: credentials } = await import(
    credentialsPath ? resolve(credentialsPath) : handleAuthFile("Credentials"),
    {
      assert: { type: "json" },
    }
  );
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oAuth2Client = new OAuth2Client(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if token exists
  if (fs.existsSync(TOKEN_PATH)) {
    const token = fs.readFileSync(TOKEN_PATH, "utf-8");
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  }

  // Get a new token
  return getAccessToken(oAuth2Client);
}

// Obtain a new token
async function getAccessToken(oAuth2Client: OAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  CLI_LOG("Authorize this app by visiting this URL: " + authUrl, "info");

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await rl.question("Enter the code from that page here: ");
  rl.close();

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  // Store the token for future use
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  CLI_LOG("Token stored to: " + TOKEN_PATH);
  return oAuth2Client;
}
