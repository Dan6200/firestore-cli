import { Options } from "commander";
import { resolve } from "path";
import { ENV_INFO } from "./auth/file-paths.mjs";
import {
  enableAndLinkBillingAccount,
  enableFirestore,
  grantAccessToFirestore,
} from "./utils/google-cloud-config.mjs";
import { CLI_LOG } from "./utils/logging.mjs";

export async function enableFirestoreAndLinkBilling(
  projectId: string,
  options: Options
) {
  try {
    if (!projectId) {
      ({
        default: { projectId },
      } = await import(resolve(ENV_INFO), {
        assert: { type: "json" },
      }));
      if (!projectId)
        throw new Error(
          "Need to set project with the `set-project` command or include `project-id` as argument"
        );
    }
    const oldProjectId = projectId;
    if (options?.billingAccountId)
      projectId = await enableAndLinkBillingAccount(projectId, options);
    if (projectId !== oldProjectId)
      throw new Error("Error response from `enableAndLinkBillingAccount`");
    const iamPolicy = await grantAccessToFirestore(projectId);
    if (!iamPolicy) throw new Error("Failed to grant access to Firestore");
    const firestore = await enableFirestore(projectId, options);
    if (!firestore) throw new Error("Error response from `enableFirestore`");
    //
    CLI_LOG("Firestore database successfully enabled.");
  } catch (e) {
    CLI_LOG(
      `Failed to enable firestore for project: ${projectId}: ` + e,
      "error"
    );
  }
}
