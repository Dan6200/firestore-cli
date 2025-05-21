import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import ora from "ora";
import { CLI_LOG } from "../../logging.mjs";
import { saveKeyToFile } from "../../msc.mjs";

export async function createServiceAccountKey(
  auth: OAuth2Client,
  serviceAccountName: string,
  keyFileName: string,
) {
  //
  if (!serviceAccountName) {
    CLI_LOG(
      "Failed to create service key: Must provide the service account name",
      "error",
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
        "info",
      );
      CLI_LOG(
        "Valid Before: " + new Date(serviceAccountKey.validBeforeTime),
        "info",
      );
      await saveKeyToFile(
        serviceAccountKey.privateKeyData,
        serviceAccountKey.validAfterTime,
        keyFileName,
      );
      return serviceAccountKey.name;
    }
    throw new Error(`Invalid respone ${serviceAccountKey}`);
  } catch (e) {
    spinner.fail();
    CLI_LOG("Failed to create Service account: " + e.message, "error");
    process.exitCode = 1;
  }
}
