import { google } from "googleapis";
import { Options } from "commander";
import ora from "ora";
import { oAuth2 } from "../../../auth/oauth2.mjs";
import parentProjectId from "../../../auth/parent-project-id.mjs";
import { CLI_LOG } from "../../logging.mjs";
import { enableCloudResourceManAPI } from "../enable-api/cloud-resource-manager.mjs";
import { serviceAccountAuth } from "../../../auth/service-account.mjs";
import { JWT, OAuth2Client } from "google-auth-library";

export async function getProject(projectId: string, options: Options) {
  const { serviceAccount } = options;
  const cloudResourceManager = google.cloudresourcemanager("v1");
  let spinner;
  try {
    const oAuthClient = await (serviceAccount
      ? serviceAccountAuth(serviceAccount)
      : oAuth2(options));
    await enableCloudResourceManAPI(
      oAuthClient as OAuth2Client | JWT,
      await parentProjectId()
    );
    spinner = ora("Retrieving project...").start();
    const { data } = await cloudResourceManager.projects.get({
      auth: oAuthClient as OAuth2Client | JWT,
      projectId,
    });
    if (data.projectId) {
      spinner.succeed("Project retrieved.");
      return data;
    } else throw new Error("Invalid response");
  } catch (e) {
    spinner.fail("Operation Failed!");
    CLI_LOG("Error retrieving project: " + e, "error");
    process.exitCode = 1;
  }
}
