import { Firestore } from "@google-cloud/firestore";
import { Options } from "commander"; // Assuming Options is defined or you'll define it
import { CLI_LOG } from "../utils/logging.mjs"; // Adjust path as needed

export async function authenticateFirestore({
  serviceAccountKey: keyFile,
  databaseId,
  debug,
  projectId, // Added projectId here
}: Options) {
  debug &&
    CLI_LOG(
      `Service Account Key: ${keyFile}\nDatabase Id: ${databaseId || "(default)"}\nExplicit Project ID: ${projectId || "(none)"}`,
      "debug",
    );

  // If an explicit projectId is provided, use it for all Firestore initializations
  if (projectId) {
    if (
      !keyFile &&
      !process.env.SERVICE_ACCOUNT_KEY &&
      !process.env.GOOGLE_APPLICATION_CREDENTIALS
    ) {
      return new Firestore({ projectId, databaseId });
    }
    if (process.env.SERVICE_ACCOUNT_KEY) {
      const { client_email, private_key } = JSON.parse(
        process.env.SERVICE_ACCOUNT_KEY,
      );
      const credentials = {
        client_email,
        private_key: private_key.replace(/\n/g, "\n"),
      };
      return new Firestore({
        projectId, // Use the explicit projectId
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key,
        },
        databaseId,
      });
    }
    if (keyFile) {
      return new Firestore({ projectId, keyFile, databaseId });
    }
    // Fallback if GOOGLE_APPLICATION_CREDENTIALS is set and no keyFile/SERVICE_ACCOUNT_KEY
    return new Firestore({ projectId, databaseId });
  }

  // Original logic if no explicit projectId is provided
  if (!keyFile && !process.env.SERVICE_ACCOUNT_KEY)
    return new Firestore({ databaseId });
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS)
    return new Firestore({ databaseId });

  let firestore;
  if (process.env.SERVICE_ACCOUNT_KEY) {
    const {
      project_id: saProjectId,
      client_email,
      private_key,
    } = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
    const credentials = {
      client_email,
      private_key: private_key.replace(/\n/g, "\n"),
    };
    firestore = new Firestore({
      projectId: saProjectId, // Use projectId from service account
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      databaseId,
    });
    return firestore;
  }
  firestore = new Firestore({ keyFile, databaseId });
  return firestore;
}
