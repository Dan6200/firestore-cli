//cspell:disable
import { Firestore } from "@google-cloud/firestore";
import { CloudBillingClient } from "@google-cloud/billing";
import { JSONClient } from "google-auth-library/build/src/auth/googleauth.js";
import { existsSync, statSync } from "fs";
import { JWT, OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { CREDENTIALS } from "../auth/file-paths.mjs";
import { handleAuthFile } from "./auth.mjs";
import { CLI_LOG } from "./logging.mjs";

const SCOPES = [
  "https://www.googleapis.com/auth/datastore",
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/devstorage.read_write",
];

export const enableFirestoreAPI = async (
  auth: OAuth2Client,
  projectId: string
) => {
  //
  CLI_LOG("Enabling Firestore API...");
  try {
    //const auth = googleAuthenticate();
    //const authClient = await auth.getClient();
    const serviceUsage = google.serviceusage("v1");
    const { data: operation } = await serviceUsage.services.enable({
      auth: auth as JWT,
      name: `projects/${projectId}/services/firestore.googleapis.com`,
    });
    if (operation.done) CLI_LOG("Firestore API enabled");
    else
      CLI_LOG(
        "Firestore API enablement is in progress...Wait a few minutes and retry with the exact same input"
      );
    return operation.done;
  } catch (e) {
    CLI_LOG("Failed to enable Firestore API..." + e, "error");
    throw e;
  }
};

export const enableCloudResourceManAPI = async (
  authClient: OAuth2Client,
  projectId: string
) => {
  //
  CLI_LOG("Enabling Cloud Resource Manager API...");
  try {
    const serviceUsage = google.serviceusage("v1");
    const { data: operation } = await serviceUsage.services.enable({
      auth: authClient,
      name: `projects/${projectId}/services/cloudresourcemanager.googleapis.com`,
    });
    if (operation.done) CLI_LOG("Cloud Resource Manager API enabled...");
    else CLI_LOG("Cloud Resource Manager API enablement is in progress...");
  } catch (e) {
    CLI_LOG("Failed to enable Cloud Resource Manager API..." + e, "error");
    throw e;
  }
};

export const enableCloudBillingAPI = async (projectId: string) => {
  //
  CLI_LOG(`Enabling Cloud Billing API for project ${projectId}...`);
  try {
    const auth = googleAuthenticate();
    const authClient = await auth.getClient();
    const serviceUsage = google.serviceusage("v1");
    const { data: operation } = await serviceUsage.services.enable({
      auth: authClient as JWT,
      name: `projects/${projectId}/services/cloudbilling.googleapis.com`,
    });
    if (operation.done) CLI_LOG("Cloud Billing API enabled...");
    else CLI_LOG("Cloud Billing API enablement is in progress...");
  } catch (e) {
    CLI_LOG("Failed to enable Cloud Billing API..." + e, "error");
    throw e;
  }
};

function googleAuthenticate() {
  const keyFile = handleAuthFile("Service Account");
  if (!existsSync(keyFile) || statSync(keyFile).isDirectory()) {
    throw new Error(`Service account key file is invalid: ${keyFile}`);
  }
  try {
    return new google.auth.GoogleAuth({
      keyFile,
      scopes: [SCOPES[1]],
    });
  } catch (e) {
    CLI_LOG("Failed Google authentication: " + e, "error");
    throw e;
  }
}

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
    throw e;
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
  CLI_LOG("Creating Firestore database...");
  try {
    const { data: operation } = await firestoreAdmin.projects.databases.create({
      auth,
      requestBody: {
        type: "FIRESTORE_NATIVE",
        locationId: locationId ?? "nam5",
      },
      parent: `projects/${projectId}`,
      databaseId: "(default)",
    });
    if (operation.done) CLI_LOG("Firestore database created.");
    else CLI_LOG("Firestore database creation is in progress...");
  } catch (e) {
    CLI_LOG("Failed to create Firestore database: " + e, "error");
    throw e;
  }
}

export async function linkCloudBillingAccount(
  projectId: string,
  billingAccountId: string
) {
  let billingClient;
  CLI_LOG("Linking billing account...");
  const auth = googleAuthenticate();
  const authClient = await auth.getClient();
  try {
    billingClient = new CloudBillingClient({
      authClient: authClient as JSONClient,
    });
  } catch (e) {
    throw new Error("Error creating cloud billing client instance: " + e);
  }
  //
  try {
    //const [accounts] = await billingClient.listBillingAccounts({
    //  name: `projects/${projectId}`,
    //});
    //console.log(accounts);
    const result = await billingClient.updateProjectBillingInfo({
      name: `projects/${projectId}`,
      projectBillingInfo: {
        billingAccountName: `billingAccounts/${billingAccountId}`,
        billingEnabled: false,
      },
    });
    //
    console.log(result);
    CLI_LOG("Billing account linked.");
  } catch (e) {
    throw new Error("Error linking billing account: " + e);
  }
}

export async function getGoogleAuthClient() {
  let authClient;
  try {
    const auth = googleAuthenticate();
    authClient = await auth.getClient();
  } catch (e) {
    throw new Error("Failed to retrieve auth client:\n" + e);
  }
  return authClient;
}
