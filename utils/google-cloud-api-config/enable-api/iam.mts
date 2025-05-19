import { OAuth2Client, JWT } from "google-auth-library";
import { google } from "googleapis";
import ora from "ora";
import { CLI_LOG } from "../../logging.mjs";

export const enableIAMAPI = async (
  authClient: OAuth2Client | JWT,
  projectId: string,
  parent?: boolean
) => {
  //
  let spinner;
  if (parent)
    spinner = ora(`Enabling IAM API for the parent project...`).start();
  else spinner = ora(`Enabling IAM API for project ${projectId}...`).start();
  try {
    const serviceUsage = google.serviceusage("v1");
    let done = false,
      error,
      response;
    while (!done) {
      ({
        data: { done, error, response },
      } = await serviceUsage.services.enable({
        auth: authClient as JWT,
        name: `projects/${projectId}/services/iam.googleapis.com`,
      }));
    }
    if (response) {
      spinner.succeed("IAM API enabled...");
      return response;
    }
    throw new Error(error.message);
  } catch (e) {
    spinner.fail();
    CLI_LOG("Failed to enable IAM API\n\t" + e.message, "error");
    process.exitCode = 1;
  }
};
