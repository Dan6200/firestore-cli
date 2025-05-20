import { Options } from "commander";
import { configureEnv } from "./configure-env.mjs";
import { enableFirestoreAndLinkBilling } from "./enable-firestore-and-link-billing.mjs";
import { setProject } from "./set-project.mjs";
import { getInput, yesNo } from "./utils/interactive.mjs";
import { CLI_LOG } from "./utils/logging.mjs";

export async function init(projectId: string, options: Options) {
  try {
    await configureEnv(options);
    //
    if (!projectId) {
      projectId = await getInput(
        "Project ID (Unique Identifier for a new or existing project):",
      );
      if (!projectId) throw new Error("Project ID cannot be empty");
    }
    if (!options?.createProject) {
      options.createProject = await yesNo("Create A New Project?");
      if (options.createProject) {
        const projectName = await getInput("Project Name:");
        if (!projectName) throw new Error("Project Name cannot be empty");
        options.projectName = projectName;
      }
    }
    await setProject(projectId, options);
    //
    if (!options.billingAccountId) {
      const linkBilling = await yesNo("Link Billing Account?");
      if (linkBilling) {
        const billingAccountId = await getInput("Billing Account ID:");
        if (!billingAccountId)
          throw new Error("Billing Account ID cannot be empty");
        options.billingAccountId = billingAccountId;
      }
    }
    await enableFirestoreAndLinkBilling(projectId, options);
    //
  } catch (e) {
    CLI_LOG(`Failed to init firestore-cli:\n\t` + e.message, "error");
    process.exit(1);
  }
}
