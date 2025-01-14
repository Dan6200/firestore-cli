import { Options } from "commander";
import { configureEnv } from "./configure-env.mjs";
import { enableFirestoreAndLinkBilling } from "./enable-firestore-and-link-billing.mjs";
import { setProject } from "./set-project.mjs";
import { getInput } from "./utils/interactive.mjs";

export async function init(options: Options) {
  await configureEnv();
  //
  const projectId = await getInput("Project ID");
  if (!projectId) throw new Error("Project ID cannot be empty");
  if (!options.createProject) {
    options.createProject = confirm("Create A New Project?");
    if (options.createProject) {
      const projectName = await getInput("Project Name");
      if (!projectName) throw new Error("Project Name cannot be empty");
      options.projectName = projectName;
    }
  }
  await setProject(projectId, options);
  //
  if (!options.billingAccountId) {
    const linkBilling = confirm("Link Billing Account?");
    if (linkBilling) {
      const billingAccountId = await getInput("Billing Account ID");
      if (!billingAccountId)
        throw new Error("Billing Account ID cannot be empty");
      options.billingAccountId = billingAccountId;
    }
  }
  await enableFirestoreAndLinkBilling(projectId, options);
  //
}
