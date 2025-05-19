import { Options } from "commander";
import { JWT, OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import ora from "ora";
import { oAuth2 } from "../../../auth/oauth2.mjs";
import parentProjectId from "../../../auth/parent-project-id.mjs";
import { serviceAccountAuth } from "../../../auth/service-account.mjs";
import { CLI_LOG } from "../../logging.mjs";
import { enableCloudResourceManAPI } from "../enable-api/cloud-resource-manager.mjs";

export async function createProject(
  projectId: string,
  { parentType, parentId, projectName, serviceAccount, ...options }: Options
) {
  if (!projectName) {
  }
  const cloudResourceManager = google.cloudresourcemanager("v1");
  let projectBody = null;
  if (parentType)
    projectBody = {
      projectId,
      name: projectName,
      parent: {
        type: parentType,
        id: `${parentType}s/${parentId}`,
      },
    };
  else projectBody = { projectId, name: projectName };
  let spinner;
  try {
    const oAuthClient = await (serviceAccount
      ? serviceAccountAuth(serviceAccount)
      : oAuth2(options));
    await enableCloudResourceManAPI(
      oAuthClient as OAuth2Client | JWT,
      await parentProjectId()
    );
    spinner = ora("Creating project...").start();
    let done = false,
      response,
      error;
    while (!done) {
      ({
        data: { done, response, error },
      } = await cloudResourceManager.projects.create({
        auth: oAuthClient as OAuth2Client | JWT,
        requestBody: projectBody,
      }));
    }
    if (response) {
      spinner.succeed("Project created.");
      return response;
    }
    throw new Error(error.message);
  } catch (e) {
    spinner.fail("Operation Failed!");
    if (e.message.match("already exists"))
      CLI_LOG(
        "Project ID already exists. Choose a different string of characters" +
          e.message,
        "error"
      );
    else CLI_LOG("Error creating project: " + e.message, "error");
    process.exitCode = 1;
  }
}
