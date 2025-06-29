import ora from "ora";
import { Options } from "commander";
import { authenticateFirestore } from "../auth/authenticate-firestore.mjs";
import { CLI_LOG } from "../utils/logging.mjs";
import { getCollectionReference } from "../utils/get-firestore-reference.mjs";
import handleWhereClause from "./utils.mjs";

export default async (collection: string, options: Options) => {
  let spinner;
  let db: FirebaseFirestore.Firestore;
  try {
    spinner = ora("Authenticating Firestore DB").start();
    db = await authenticateFirestore(options);
    spinner.succeed("Successfully authenticated!");
  } catch (error) {
    spinner.fail("Failed to authenticate to Firestore DB.");
    CLI_LOG(error.toString(), "error");
    process.exitCode = 1;
    process.exit();
  }
  const ref = getCollectionReference(db, collection);
  const q = handleWhereClause(ref, options.where);
  const docs = await q.get();
  if (docs.empty) return;
  docs.forEach((doc) => {
    process.stdout.write(doc.ref.path + "\n");
  });
};
