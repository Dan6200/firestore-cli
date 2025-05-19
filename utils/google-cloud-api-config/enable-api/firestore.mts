import { OAuth2Client, JWT } from "google-auth-library";
import { google } from "googleapis";
import ora from "ora";
import { CLI_LOG } from "../../logging.mjs";

export const enableFirestoreAPI = async (
  auth: OAuth2Client | JWT,
  projectId: string
) => {
  //
  const spinner = ora("Enabling Firestore API...").start();
  try {
    const serviceUsage = google.serviceusage("v1");
    let done = false,
      response,
      error;
    while (!done) {
      ({
        data: { done, response, error },
      } = await serviceUsage.services.enable({
        auth: auth as JWT,
        name: `projects/${projectId}/services/firestore.googleapis.com`,
      }));
    }
    if (response) {
      spinner.succeed("Firestore API enabled");
      return response;
    }
    throw new Error(error.message);
  } catch (e) {
    spinner.fail();
    CLI_LOG("Failed to enable Firestore API:\n\t" + e.message, "error");
    process.exitCode = 1;
  }
};
