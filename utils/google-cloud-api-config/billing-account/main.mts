import { Options } from "commander";
import { JWT, OAuth2Client } from "google-auth-library";
import { oAuth2 } from "../../../auth/oauth2.mjs";
import parentProjectId from "../../../auth/parent-project-id.mjs";
import { serviceAccountKeyAuth } from "../../../auth/service-account-key.mjs";
import { enableCloudBillingAPI } from "../enable-api/cloud-billing.mjs";
import { linkCloudBillingAccount } from "./link-billing-account.mjs";
import { CLI_LOG } from "../../logging.mjs";

export async function enableAndLinkBillingAccount(
  projectId: string,
  { billingAccountId, serviceAccountKey, ...options }: Options,
) {
  if (options.debug) {
    CLI_LOG({ billingAccountId, serviceAccountKey, options }, "debug");
  }
  const oAuthClient = await (serviceAccountKey
    ? serviceAccountKeyAuth(serviceAccountKey)
    : oAuth2(options));
  const cloudBillingResource = await enableCloudBillingAPI(
    oAuthClient as JWT | OAuth2Client,
    await parentProjectId(),
    true,
  );
  if (!cloudBillingResource) throw new Error();
  return linkCloudBillingAccount(
    oAuthClient as OAuth2Client | JWT,
    projectId,
    billingAccountId,
  );
}
