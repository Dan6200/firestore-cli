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
import { handleAuthFile } from "./auth.mjs";

export const enableFirestoreAPI = async (
  auth: OAuth2Client,
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
    spinner.fail();
    throw new Error(error.message);
  } catch (e) {
    CLI_LOG("Failed to enable Firestore API..." + e, "error");
    process.exitCode = 1;
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
    spinner.fail();
    throw new Error(error.message);
  } catch (e) {
    CLI_LOG("Failed to enable Cloud Resource Manager API..." + e, "error");
    process.exitCode = 1;
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
    spinner.fail();
    throw new Error(error.message);
  } catch (e) {
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
    spinner.fail();
    throw new Error(error.message);
  } catch (e) {
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
  { locationId, databaseId }: Options
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
    let done = false,
      response,
      error;
    while (!done) {
      ({
        data: { done, response, error },
      } = await firestoreAdmin.projects.databases.create({
        auth,
        requestBody: locationId
          ? {
              type: "FIRESTORE_NATIVE",
            }
          : {
              type: "FIRESTORE_NATIVE",
              locationId: locationId,
            },
        parent: `projects/${projectId}`,
        databaseId,
      }));
    }
    if (response) {
      spinner.succeed("Firestore database created.");
      return response;
    }
    throw new Error(error.message);
  } catch (e) {
    spinner.fail();
    if (e.message.match("Database already exists"))
      CLI_LOG(
        `Failed to create Firestore database: The database \`${databaseId}\` already exists. Please use another database.`,
        `error`
      );
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

export async function grantAccessToFirestore(
  projectId: string,
  { serviceAccount, ...options }: Options
) {
  const {
    default: { client_email: serviceAccountEmail },
  } = await import(handleAuthFile("Service Account", serviceAccount), {
    assert: { type: "json" },
  });
  const oAuthClient = await oAuth2(options);
  const spinner = ora("Granting access to firestore...").start();
  let iamPolicy;
  try {
    iamPolicy = await grantRoleToServiceAccount(
      oAuthClient,
      projectId,
      serviceAccountEmail,
      "roles/datastore.user"
    );
    spinner.succeed("Successfully granted access to firestore.");
    return iamPolicy;
  } catch (e) {
    spinner.fail();
    CLI_LOG("Failed to grant access to firestore: " + e, "error");
    process.exitCode = 1;
  }
}

export async function enableFirestore(projectId: string, options: Options) {
  const oAuthClient = await oAuth2(options);
  const response = await enableFirestoreAPI(oAuthClient, projectId);
  if (!response) return;
  return createFirestoreDatabase(oAuthClient, projectId, options);
}

export async function enableAndLinkBillingAccount(
  projectId: string,
  { billingAccountId, ...options }: Options
) {
  const oAuthClient = await oAuth2(options);
  await enableCloudBillingAPI(oAuthClient, await parentProjectId(), true);
  return linkCloudBillingAccount(oAuthClient, projectId, billingAccountId);
}

export async function getProject(projectId: string, options: Options) {
  const cloudResourceManager = google.cloudresourcemanager("v1");
  let spinner;
  try {
    const oAuthClient = await oAuth2(options);
    await enableCloudResourceManAPI(oAuthClient, await parentProjectId());
    spinner = ora("Retrieving project...").start();
    const { data } = await cloudResourceManager.projects.get({
      auth: oAuthClient,
      projectId,
    });
    if (data.projectId) {
      spinner.succeed("Project retrieved.");
      return data;
    } else throw new Error("Invalide response");
  } catch (e) {
    spinner.fail("Operation Failed!");
    CLI_LOG("Error retrieving project: " + e, "error");
    process.exitCode = 1;
  }
}

export async function createProject(
  projectId: string,
  { parentType, parentId, projectName, ...options }: Options
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
    const oAuthClient = await oAuth2(options);
    await enableCloudResourceManAPI(oAuthClient, await parentProjectId());
    spinner = ora("Creating project...").start();
    let done = false,
      response,
      error;
    while (!done) {
      ({
        data: { done, response, error },
      } = await cloudResourceManager.projects.create({
        auth: oAuthClient,
        requestBody: projectBody,
      }));
    }
    if (response) {
      spinner.succeed("Project created.");
      return response;
    }
    if (error) {
      spinner.fail("Operation Failed!");
      throw new Error(error.message);
    }
  } catch (e) {
    CLI_LOG("Error creating project: " + e, "error");
    process.exitCode = 1;
  }
}

async function grantRoleToServiceAccount(
  auth: OAuth2Client,
  projectId: string,
  serviceAccountEmail: string,
  role: string
) {
  const crm = google.cloudresourcemanager("v1");
  let { data: policy } = await crm.projects.getIamPolicy({
    resource: projectId,
    auth,
  });
  //
  const binding = {
    role,
    members: [`serviceAccount:${serviceAccountEmail}`],
  };
  //
  const { bindings } = policy;
  policy.bindings = [...(bindings ?? []), binding];
  //
  return crm.projects.setIamPolicy({
    resource: projectId,
    requestBody: { policy },
    auth,
  });
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
