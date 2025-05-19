import { OAuth2Client, JWT } from "google-auth-library";
import { google } from "googleapis";
import ora from "ora";
import { CLI_LOG } from "../../logging.mjs";

export const enableCloudResourceManAPI = async (
  authClient: OAuth2Client | JWT,
  projectId: string
) => {
  //
  const spinner = ora("Enabling Cloud Resource Manager API...").start();
  try {
    const serviceUsage = google.serviceusage("v1");
    let done = false,
      error,
      response;
    while (!done) {
      ({
        data: { done, error, response },
      } = await serviceUsage.services.enable({
        auth: authClient,
        name: `projects/${projectId}/services/cloudresourcemanager.googleapis.com`,
      }));
    }
    if (response) {
      spinner.succeed("Cloud Resource Manager API enabled...");
      return response;
    }
    throw new Error(error.message);
  } catch (e) {
    spinner.fail();
    CLI_LOG(
      "Failed to enable Cloud Resource Manager API\n\t" + e.message,
      "error"
    );
    throw new Error();
  }
};
