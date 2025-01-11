//cspell:disable
import { CLI_LOG } from "./utils/logging.mjs";
import { getInput } from "./utils/interactive.mjs";
import {
  configureFirestore,
  createFirestoreDatabase,
  enableCloudBillingAPI,
  enableCloudResourceManAPI,
  enableFirestoreAPI,
  linkCloudBillingAccount,
} from "./utils/google-cloud-config.mjs";
import ora from "ora";
import { google } from "googleapis";
import { oAuth2 } from "./auth/oauth2.mjs";
import { Options } from "commander";

const THIS_PROJECT_ID = "firestore-cli-01";

export async function enableFirestore(
  projectId: string,
  { locationId }: Options
) {
  const oAuthClient = await oAuth2();
  const done = await enableFirestoreAPI(oAuthClient, projectId);
  if (!done) return;
  await createFirestoreDatabase(oAuthClient, projectId, locationId);
}

export async function enableAndLinkBillingAccount(
  projectId: string,
  billingAccountId: string
) {
  await enableCloudBillingAPI(projectId);
  await linkCloudBillingAccount(projectId, billingAccountId);
}

export async function createProject(
  projectId: string,
  projectName: string,
  parentType?: "folder" | "organization",
  parentId?: string
) {
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
    const oAuthClient = await oAuth2();
    await enableCloudResourceManAPI(oAuthClient, THIS_PROJECT_ID);
    spinner = ora("Creating project...").start();
    const createResponse = await cloudResourceManager.projects.create({
      auth: oAuthClient,
      requestBody: projectBody,
    });
    spinner.succeed("Project created: ");
    const { done } = createResponse.data;
    if (done === false) return done;
    return projectId;
  } catch (e) {
    spinner.fail("Operation Failed!");
    CLI_LOG("Error creating project: " + e, "error");
    throw new Error();
  }
}
