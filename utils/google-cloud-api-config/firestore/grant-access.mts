import { OAuth2Client, JWT } from "google-auth-library";
import ora from "ora";
import { Options } from "commander";
import { handleAuthFile } from "../../auth.mjs";
import { CLI_LOG } from "../../logging.mjs";
import { grantRoleToServiceAccount } from "../service-accounts/grant-role.mjs";
import { serviceAccountKeyAuth } from "../../../auth/service-account-key.mjs";

export async function grantAccessToFirestore(
  projectId: string,
  { serviceAccountKey }: Options,
) {
  const {
    default: { client_email: serviceAccountEmail },
  } = await import(handleAuthFile("Service Account Key", serviceAccountKey), {
    with: { type: "json" },
  });
  const oAuthClient = await serviceAccountKeyAuth(serviceAccountKey);
  const spinner = ora("Granting access to firestore...").start();
  let iamPolicy;
  try {
    iamPolicy = await grantRoleToServiceAccount(
      oAuthClient as OAuth2Client | JWT,
      projectId,
      serviceAccountEmail,
      "roles/datastore.user",
    );
    spinner.succeed("Successfully granted access to firestore.");
    return iamPolicy;
  } catch (e) {
    spinner.fail();
    CLI_LOG("Failed to grant access to firestore: " + e, "error");
    process.exitCode = 1;
  }
}
