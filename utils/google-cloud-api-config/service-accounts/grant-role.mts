import { readFileSync } from "fs";
import { OAuth2Client, JWT } from "google-auth-library";
import { google } from "googleapis";
import { TOKEN_PATH } from "../../../auth/file-paths.mjs";

export async function grantRoleToServiceAccount(
  auth: OAuth2Client | JWT,
  projectId: string,
  role: string,
  serviceAccountKey: string,
) {
  const crm = google.cloudresourcemanager("v1");
  let { data: policy } = await crm.projects.getIamPolicy({
    resource: projectId,
    auth,
  });
  //
  let serviceAccountEmail, userEmail;
  if (serviceAccountKey) {
    ({ serviceAccountEmail } = await import(serviceAccountKey, {
      with: { type: "json" },
    }));
  } else {
    const accessToken = readFileSync(TOKEN_PATH, "utf-8");
    userEmail = await auth
      .getTokenInfo(accessToken)
      .then((tokenInfo) => tokenInfo.email);
  }
  const binding = {
    role,
    members: [
      serviceAccountEmail
        ? `serviceAccount:${serviceAccountEmail}`
        : `user:${userEmail}`,
    ],
  };
  //
  const { bindings } = policy;
  policy.bindings = [...(bindings ?? []), binding];
  //
  return crm.projects.setIamPolicy({
    resource: projectId,
    requestBody: { policy },
    auth,
  });
}
