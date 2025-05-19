import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import ora from "ora";
import { getInput } from "../../interactive.mjs";
import { CLI_LOG } from "../../logging.mjs";

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
  const spinner = ora("Creating Service Account...").start();
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
    CLI_LOG("Failed to create Service account: " + e.message, "error");
    process.exitCode = 1;
  }
}
