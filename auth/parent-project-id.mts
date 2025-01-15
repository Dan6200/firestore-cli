import { handleAuthFile } from "../utils/auth.mjs";
import { CLI_LOG } from "../utils/logging.mjs";

async function getParentProjectId() {
  try {
    const { default: credentials } = await import(
      handleAuthFile("Credentials"),
      {
        assert: { type: "json" },
      }
    );
    return credentials.installed.project_id;
  } catch (e) {
    if (e.message.match("OAuth")) {
      CLI_LOG(e.message, "error");
      process.exitCode = 1;
    } else
      CLI_LOG(
        "Failed To Authenticate User: Run the `firestore-cli init` command:\n" +
          e.message,
        "error"
      );
    process.exitCode = 1;
  }
}

export default getParentProjectId;
