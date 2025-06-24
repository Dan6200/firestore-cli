//cspell:disable
import ora from "ora";
import { Options } from "commander";
import { CLI_LOG } from "./utils/logging.mjs";
import { authenticateFirestore } from "./auth/authenticate-firestore.mjs";
import { getFirestoreReference } from "./utils/get-firestore-reference.mjs";
import {
  CollectionReference,
  DocumentReference,
} from "@google-cloud/firestore";

export default async (path: string, options: Options) => {
  const spinner = ora("Deleting document(s) in " + path + "\n").start();
  try {
    const db = await authenticateFirestore(options);
    if (options.bulk) {
      const batch = db.batch();
      const ref = getFirestoreReference(db, path);
      if (ref instanceof DocumentReference)
        throw new Error(
          `Path must be to a collection for bulk operations: \`${path}\` has an odd number of segments, representing a document reference.`,
        );
      const collectionDocumentsSnapshot = await ref.get();
      collectionDocumentsSnapshot.docs.map((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });
      try {
        await batch.commit();
      } catch (e) {
        throw new Error("Failed to add new documents: " + e);
      }
    } else {
      const ref = getFirestoreReference(db, path);
      if (ref instanceof CollectionReference)
        throw new Error(
          `Path must be to a document for singular operations: \`${path}\` has an even number of segments, representing a collection reference. Use the --bulk flag for collection operations.`,
        );
      await db.doc(path).delete();
    }
    spinner.succeed("Done!");
  } catch (e) {
    spinner.fail("Failed to fetch documents!");
    CLI_LOG(e.message, "error");
    process.exitCode = 1;
  }
};
