import { Firestore } from "@google-cloud/firestore";
import { CREDENTIALS } from "../../../auth/file-paths.mjs";
import { CLI_LOG } from "../../logging.mjs";

export function configureFirestore(projectId: string) {
  //
  // Configuring firestore
  CLI_LOG("Configuring firestore...");
  try {
    const firestore = new Firestore({
      projectId,
      keyFilename: CREDENTIALS,
    });
    //
    firestore.settings({ ignoreUndefinedProperties: true });
    CLI_LOG("Firestore database configured");
  } catch (e) {
    CLI_LOG("Failed to configure Firestore database\n\t" + e.message, "error");
    process.exitCode = 1;
  }
}
