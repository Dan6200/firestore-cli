import { CloudBillingClient } from "@google-cloud/billing";
import { OAuth2Client, JWT } from "google-auth-library";
import { JSONClient } from "google-auth-library/build/src/auth/googleauth.js";
import ora from "ora";
import { CLI_LOG } from "../../logging.mjs";

export async function linkCloudBillingAccount(
  authClient: OAuth2Client | JWT,
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
