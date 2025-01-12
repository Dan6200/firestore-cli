//cspell:disable
import { Firestore } from "@google-cloud/firestore";
import { CloudBillingClient } from "@google-cloud/billing";
import { JSONClient } from "google-auth-library/build/src/auth/googleauth.js";
import { JWT, OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { CREDENTIALS } from "../auth/file-paths.mjs";
import { CLI_LOG } from "./logging.mjs";
import { getInput } from "./interactive.mjs";
import { saveKeyToFile } from "./msc.mjs";
import ora from "ora";
import { Options } from "commander";
import { oAuth2 } from "../auth/oauth2.mjs";
import parentProjectId from "../auth/parent-project-id.mjs";

export const enableFirestoreAPI = async (
  auth: OAuth2Client,
  projectId: string
) => {
  //
  const spinner = ora("Enabling Firestore API...").start();
  try {
    const serviceUsage = google.serviceusage("v1");
    let done = false;
    while (!done) {
      ({
        data: { done },
      } = await serviceUsage.services.enable({
        auth: auth as JWT,
        name: `projects/${projectId}/services/firestore.googleapis.com`,
      }));
    }
    spinner.succeed("Firestore API enabled");
    return done;
  } catch (e) {
    spinner.fail();
    CLI_LOG("Failed to enable Firestore API..." + e, "error");
    throw e;
  }
};

export const enableCloudResourceManAPI = async (
  authClient: OAuth2Client,
  projectId: string
) => {
  //
  const spinner = ora("Enabling Cloud Resource Manager API...").start();
  try {
    const serviceUsage = google.serviceusage("v1");
    let done = false;
    while (!done) {
      ({
        data: { done },
      } = await serviceUsage.services.enable({
        auth: authClient,
        name: `projects/${projectId}/services/cloudresourcemanager.googleapis.com`,
      }));
    }
    if (done) spinner.succeed("Cloud Resource Manager API enabled...");
  } catch (e) {
    spinner.fail();
    CLI_LOG("Failed to enable Cloud Resource Manager API..." + e, "error");
    throw e;
  }
};

export const enableIAMAPI = async (
  authClient: OAuth2Client,
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
    let done = false;
    while (!done) {
      ({
        data: { done },
      } = await serviceUsage.services.enable({
        auth: authClient as JWT,
        name: `projects/${projectId}/services/iam.googleapis.com`,
      }));
    }
    if (done) spinner.succeed("IAM API enabled...");
  } catch (e) {
    spinner.fail();
    CLI_LOG("Failed to enable IAM API..." + e, "error");
    process.exitCode = 1;
  }
};

export const enableCloudBillingAPI = async (
  auth: OAuth2Client,
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
    let done = false;
    while (!done) {
      ({
        data: { done },
      } = await serviceUsage.services.enable({
        auth: auth,
        name: `projects/${projectId}/services/cloudbilling.googleapis.com`,
      }));
    }
    if (done) spinner.succeed("Cloud Billing API enabled...");
  } catch (e) {
    spinner.fail();
    CLI_LOG("Failed to enable Cloud Billing API..." + e, "error");
    process.exitCode = 1;
  }
};

export function configureFirestore(projectId: string) {
  //
  // Configuring firestore
  CLI_LOG("Configuring firestore...");
  try {
    const firestore = new Firestore({
      projectId,
      keyFilename: CREDENTIALS,
    });
    //
    firestore.settings({ ignoreUndefinedProperties: true });
    CLI_LOG("Firestore database configured");
  } catch (e) {
    CLI_LOG("Failed to configure Firestore database..." + e, "error");
    process.exitCode = 1;
  }
}

export async function createServiceAccountKey(
  auth: OAuth2Client,
  serviceAccountName: string,
  keyFileName: string
) {
  //
  if (!serviceAccountName) {
    CLI_LOG(
      "Failed to create service key: Must provide the service account name",
      "error"
    );
    throw new Error();
  }
  const iamAdmin = google.iam("v1");
  const spinner = ora("Creating Service Account...").start();
  try {
    const { data: serviceAccountKey } =
      await iamAdmin.projects.serviceAccounts.keys.create({
        auth,
        name: serviceAccountName,
      });
    if (serviceAccountKey.name) {
      spinner.succeed("Service account key created.");
      CLI_LOG(
        "Valid After: " + new Date(serviceAccountKey.validAfterTime),
        "info"
      );
      CLI_LOG(
        "Valid Before: " + new Date(serviceAccountKey.validBeforeTime),
        "info"
      );
      saveKeyToFile(
        serviceAccountKey.privateKeyData,
        serviceAccountKey.validAfterTime,
        keyFileName
      );
      return serviceAccountKey.name;
    }
    throw new Error(`Invalid respone ${serviceAccountKey}`);
  } catch (e) {
    spinner.fail();
    CLI_LOG("Failed to create Service account: " + e, "error");
    process.exitCode = 1;
  }
}

export async function createServiceAccount(
  auth: OAuth2Client,
  projectId: string
) {
  //
  // Creating Service Account...  //
  const serviceAccountId = await getInput("Service Account ID"),
    serviceAccDisplayName = await getInput("Service Account Display Name"),
    serviceAccountDescription = await getInput("Service Account Description");
  //
  if (!serviceAccountId || !serviceAccDisplayName) {
    CLI_LOG(
      "Failed to create service account: Must provide a service account ID and a service account display name",
      "error"
    );
    throw new Error();
  }
  const iamAdmin = google.iam("v1");
  const spinner = ora("Creating Service Acount...").start();
  try {
    const serviceAccountReq = serviceAccountDescription
      ? {
          description: serviceAccountDescription,
          displayName: serviceAccDisplayName,
        }
      : {
          displayName: serviceAccDisplayName,
        };
    const { data: serviceAccount } =
      await iamAdmin.projects.serviceAccounts.create({
        auth,
        name: `projects/${projectId}`,
        requestBody: {
          accountId: serviceAccountId,
          serviceAccount: serviceAccountReq,
        },
      });
    if (serviceAccount.name) spinner.succeed("Service account created.");
    else throw new Error(`Invalid respone ${serviceAccount}`);
    return serviceAccount.name;
  } catch (e) {
    spinner.fail();
    CLI_LOG("Failed to create Service account: " + e, "error");
    process.exitCode = 1;
  }
}

export async function createFirestoreDatabase(
  auth: OAuth2Client,
  projectId: string,
  locationId: string
) {
  //
  // Creating Firestore Database...  //
  const firestoreAdmin = google.firestore("v1");
  if (!locationId) {
    CLI_LOG(
      "Failed to create Firestore database: Must provide location ID when creating a firestore database",
      "error"
    );
    throw new Error();
  }
  const spinner = ora("Creating Firestore database...").start();
  try {
    let done = false;
    while (!done) {
      ({
        data: { done },
      } = await firestoreAdmin.projects.databases.create({
        auth,
        requestBody: {
          type: "FIRESTORE_NATIVE",
          locationId: locationId ?? "nam5",
        },
        parent: `projects/${projectId}`,
        databaseId: "(default)",
      }));
    }
    spinner.succeed("Firestore database created.");
    return done;
  } catch (e) {
    CLI_LOG("Failed to create Firestore database: " + e, "error");
    process.exitCode = 1;
  }
}

export async function linkCloudBillingAccount(
  authClient: OAuth2Client,
  projectId: string,
  billingAccountId: string
) {
  let billingClient;
  const spinner = ora("Linking billing account...").start();
  try {
    billingClient = new CloudBillingClient({
      authClient: authClient as JSONClient,
    });
  } catch (e) {
    throw new Error("Error creating cloud billing client instance: " + e);
  }
  //
  try {
    const [{ name }] = await billingClient.updateProjectBillingInfo({
      name: `projects/${projectId}`,
      projectBillingInfo: {
        billingAccountName: `billingAccounts/${billingAccountId}`,
        billingEnabled: false,
      },
    });
    //
    if (!name) throw new Error("Invalid response when updating billing info");
    spinner.succeed("Billing account linked.");
    return name;
  } catch (e) {
    spinner.fail();
    CLI_LOG("Error linking billing account: " + e.message, "error");
    process.exitCode = 1;
  }
}

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
  const oAuthClient = await oAuth2();
  await enableCloudBillingAPI(oAuthClient, await parentProjectId, true);
  await linkCloudBillingAccount(oAuthClient, projectId, billingAccountId);
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
    await enableCloudResourceManAPI(oAuthClient, await parentProjectId);
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
    process.exitCode = 1;
  }
}

//function googleAuthenticate() {
//  const keyFile = handleAuthFile("Service Account");
//  if (!existsSync(keyFile) || statSync(keyFile).isDirectory()) {
//    throw new Error(`Service account key file is invalid: ${keyFile}`);
//  }
//  try {
//    return new google.auth.GoogleAuth({
//      keyFile,
//      scopes: [SCOPES[1]],
//    });
//  } catch (e) {
//    CLI_LOG("Failed Google authentication: " + e, "error");
//    throw e;
//  }
//}

//export async function getGoogleAuthClient() {
//  let authClient;
//  try {
//    const auth = googleAuthenticate();
//    authClient = await auth.getClient();
//  } catch (e) {
//    throw new Error("Failed to retrieve auth client:\n" + e);
//  }
//  return authClient;
//}
