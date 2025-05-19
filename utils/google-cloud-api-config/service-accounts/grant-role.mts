import { OAuth2Client, JWT } from "google-auth-library";
import { google } from "googleapis";

export async function grantRoleToServiceAccount(
  auth: OAuth2Client | JWT,
  projectId: string,
  serviceAccountEmail: string,
  role: string
) {
  const crm = google.cloudresourcemanager("v1");
  let { data: policy } = await crm.projects.getIamPolicy({
    resource: projectId,
    auth,
  });
  //
  const binding = {
    role,
    members: [`serviceAccount:${serviceAccountEmail}`],
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
