import { handleAuthFile } from "../utils/auth.mjs";

async function getParentProjectId() {
  const { default: credentials } = await import(handleAuthFile("Credentials"), {
    assert: { type: "json" },
  });
  return credentials.installed.project_id;
}

export default getParentProjectId();
