import { OAuth2Client, JWT } from "google-auth-library";
import { google } from "googleapis";
import ora from "ora";
import { CLI_LOG } from "../../logging.mjs";

export const enableCloudBillingAPI = async (
  auth: OAuth2Client | JWT,
  projectId: string,
  parent?: boolean
) => {
  //
  let spinner;
  if (parent)
    spinner = ora(
      `Enabling Cloud Billing API for the parent project...`
    ).start();
  else
    spinner = ora(
      `Enabling Cloud Billing API for project ${projectId}...`
    ).start();
  try {
    const serviceUsage = google.serviceusage("v1");
    let done = false,
      response,
      error;
    while (!done) {
      ({
        data: { done, response, error },
      } = await serviceUsage.services.enable({
        auth: auth,
        name: `projects/${projectId}/services/cloudbilling.googleapis.com`,
      }));
    }
    if (response) {
      spinner.succeed("Cloud Billing API enabled...");
      return response;
    }
    throw new Error(error.message);
  } catch (e) {
    spinner.fail();
    CLI_LOG("Failed to enable Cloud Billing API\n\t" + e.message, "error");
    process.exitCode = 1;
  }
};
