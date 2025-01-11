import { Options } from "commander";
import {
  enableAndLinkBillingAccount,
  enableFirestore,
} from "./enable-firestore.mjs";
import { getInput } from "./utils/interactive.mjs";
import { CLI_LOG } from "./utils/logging.mjs";

export async function enableFirestoreAndLinkBilling(
  projectId: string,
  options: Options
) {
  try {
    if (options?.linkBilling) {
      const billingAccountId =
        options?.billingAccountId ??
        (await getInput("Billing Account ID")).trim();
      await enableAndLinkBillingAccount(projectId, billingAccountId);
    }
    await enableFirestore(projectId, options);
    //
    CLI_LOG("Firestore database successfully created.");
  } catch (e) {
    CLI_LOG(`Failed to set project ${projectId ?? ""}`, "error");
  }
}
