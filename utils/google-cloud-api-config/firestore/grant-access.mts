import { OAuth2Client, JWT } from "google-auth-library";
import ora from "ora";
import { Options } from "commander";
import { CLI_LOG } from "../../logging.mjs";
import { grantRoleToServiceAccount } from "../service-accounts/grant-role.mjs";
import { serviceAccountKeyAuth } from "../../../auth/service-account-key.mjs";
import { oAuth2 } from "../../../auth/oauth2.mjs";

export async function grantAccessToFirestore(
  projectId: string,
  options: Options,
) {
  const oAuthClient = await (options.serviceAccountKey
    ? serviceAccountKeyAuth(options.serviceAccountKey)
    : oAuth2(options));
  CLI_LOG(
    "You need to create a Service Account and a Service Account Key to enable Firestore",
  );
  const spinner = ora("Granting access to firestore...").start();
  let iamPolicy;
  try {
    // Grant firestore access...
    iamPolicy = await grantRoleToServiceAccount(
      oAuthClient as OAuth2Client | JWT,
      projectId,
      "roles/datastore.user",
      options.serviceAccountKey,
    );
    spinner.succeed("Successfully granted access to firestore.");
    return iamPolicy;
  } catch (e) {
    spinner.fail();
    CLI_LOG("Failed to grant access to firestore: " + e, "error");
    process.exitCode = 1;
  }
}
