import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import { resolve } from "path";
import { TOKEN_PATH } from "./file-paths.mjs";
import { CLI_LOG } from "../utils/logging.mjs";
import { handleAuthFile } from "../utils/auth.mjs";
import { SCOPES } from "./scopes.mjs";
import {
  WithoutBillingAccount,
  WithoutServiceAccount,
} from "../types-and-interfaces.mjs";
import open from "open";
import express, { Request, Response } from "express";

const PORT = 1234;
const URI = `http://127.0.0.1:${PORT}`;

// Load client secrets from a local file
export async function oAuth2({
  credentials: credentialsPath,
}: WithoutServiceAccount | WithoutBillingAccount) {
  try {
    const { default: credentials } = await import(
      credentialsPath
        ? resolve(credentialsPath)
        : handleAuthFile("Credentials"),
      {
        assert: { type: "json" },
      }
    );
    const { client_id, client_secret } = credentials.installed;
    const oAuth2Client = new OAuth2Client(client_id, client_secret, URI);
    //
    if (fs.existsSync(TOKEN_PATH)) {
      const token = fs.readFileSync(TOKEN_PATH, "utf-8");
      oAuth2Client.setCredentials(JSON.parse(token));
      return oAuth2Client;
    }
    //
    await startOAuthServer(oAuth2Client);
    //
    return oAuth2Client;
  } catch (e) {
    CLI_LOG(
      e.message.match("OAuth")
        ? e.message
        : "Failed To Authenticate User: \n\t" + e.message,
      "error"
    );
    process.exitCode = 1;
  }
}

async function startOAuthServer(oAuth2Client: OAuth2Client) {
  const app = express();

  // Promisify the OAuth handling process. Else leads to Unexpected behavior
  const authPromise = new Promise((resolve, reject) => {
    app.get("/", async (req: Request, res: Response) => {
      try {
        const { code } = req.query;
        if (!code) {
          res.status(400).send("<h1>Authorization code not received</h1>");
          return reject(new Error("No authorization code"));
        }
        //
        const { tokens } = await oAuth2Client.getToken(code as string);
        oAuth2Client.setCredentials(tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        CLI_LOG("Token stored to: " + TOKEN_PATH);
        //
        res.send(
          "<h1>Authorization successful! You can now close this window.</h1>"
        );
        resolve(tokens);
      } catch (err) {
        res.status(500).send("<h1>Error exchanging code for token</h1>");
        reject(err);
      } finally {
        server.close();
        CLI_LOG("server closed");
      }
    });
  });
  //
  const server = app.listen(PORT, () => {
    console.log("");
    CLI_LOG(
      `New browser window opened at ${URI}. Please complete the authorization process to proceed.\n`,
      "info"
    );
  });
  //
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    redirect_uri: URI,
  });
  //
  await open(authUrl);
  CLI_LOG("Waiting for user to complete authorization in the browser...");
  //
  await authPromise;
  CLI_LOG("OAuth flow completed!");
}
