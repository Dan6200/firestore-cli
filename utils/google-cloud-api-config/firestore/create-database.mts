import { OAuth2Client, JWT } from "google-auth-library";
import { google } from "googleapis";
import ora from "ora";
import { Options } from "commander";
import { CLI_LOG } from "../../logging.mjs";

export async function createFirestoreDatabase(
  auth: OAuth2Client | JWT,
  projectId: string,
  { locationId, databaseId }: Options
) {
  //
  // Creating Firestore Database...  //
  const firestoreAdmin = google.firestore("v1");
  if (!locationId) {
    CLI_LOG(
      "Failed to create Firestore database: Must provide location ID when creating a firestore database",
      "error"
    );
    throw new Error();
  }
  const spinner = ora("Creating Firestore database...").start();
  try {
    let done = false,
      response,
      error;
    while (!done) {
      ({
        data: { done, response, error },
      } = await firestoreAdmin.projects.databases.create({
        auth,
        requestBody: locationId
          ? {
              type: "FIRESTORE_NATIVE",
            }
          : {
              type: "FIRESTORE_NATIVE",
              locationId: locationId,
            },
        parent: `projects/${projectId}`,
        databaseId,
      }));
    }
    if (response) {
      spinner.succeed("Firestore database created.");
      return response;
    }
    throw new Error(error.message);
  } catch (e) {
    spinner.fail();
    if (e.message.match("Database already exists"))
      CLI_LOG(
        `Failed to create Firestore database: The database \`${databaseId}\` already exists. Please use another database.`,
        `error`
      );
    CLI_LOG("Failed to create Firestore database: " + e.message, "error");
    process.exitCode = 1;
  }
}
