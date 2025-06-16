//cspell:disable
import { Chalk } from "chalk";
import ora from "ora";
import { Options } from "commander";
import { printDocuments } from "./utils/print/documents.mjs";
import { DocumentSnapshot, QuerySnapshot } from "@google-cloud/firestore";
import { initializePager } from "./init-pager.mjs";
import { CLI_LOG } from "./utils/logging.mjs";
import { authenticateFirestore } from "./auth/authenticate-firestore.mjs";
import { getFirestoreReference } from "./utils/get-firestore-reference.mjs";
import { printJSON } from "./utils/print/json.mjs";
const chalk = new Chalk({ level: 3 });

export default async (path: string, options: Options) => {
  let error = false;
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

  const { pager, failedToStartPager } = initializePager(options);

  let snapshot: null | QuerySnapshot | DocumentSnapshot = null;
  try {
    spinner = ora("Fetching documents from " + path + "\n").start();
    const ref = getFirestoreReference(db, path);
    snapshot = await ref.get();
    if (failedToStartPager) spinner.succeed("Done!");
    // TODO: Move this to its own subcommand...
    // if (options.where?.length > 0) {
    //   let ref: CollectionReference | Query = db.collection(path);
    //   snapshot = await handleWhereClause(ref, options.where).get();
    // } else {}
  } catch (error) {
    pager.kill();
    spinner.fail("Failed to fetch document path.");
    if (error.message.includes("not found"))
      CLI_LOG(`Cannot find the resource at the given path ${path}`, "error");
    else CLI_LOG(error.toString(), "error");
    process.exitCode = 1;
    process.exit();
  }
  //
  let stdOutput = null;
  try {
    if (options.json) {
      stdOutput = printJSON(snapshot, options);
      if (failedToStartPager) process.stdout.write(stdOutput);
    } else
      stdOutput = printDocuments(
        snapshot,
        chalk,
        failedToStartPager,
        options.whiteSpace,
      );
    if (!failedToStartPager) {
      spinner.succeed("Done!");
      pager.stdin.write(stdOutput);
    }
  } catch (e) {
    spinner.fail("Failed to fetch documents!");
    CLI_LOG(e, "error", pager);
    error = true;
  } finally {
    if (!failedToStartPager) pager.stdin.end();
    if (error) process.exitCode = 1;
  }
};
