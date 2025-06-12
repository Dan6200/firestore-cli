//cspell:disable
import { Chalk } from "chalk";
import ora from "ora";
import { Options } from "commander";
import { printDocuments } from "./utils/print.mjs";
import {
  CollectionReference,
  Query,
  QuerySnapshot,
} from "@google-cloud/firestore";
import { initializePager } from "./init-pager.mjs";
import handleWhereClause from "./utils/handle-where-clause.mjs";
import { CLI_LOG } from "./utils/logging.mjs";
import { authenticateFirestore } from "./auth/authenticate-firestore.mjs";

const chalk = new Chalk({ level: 3 });

export default async (collection: string, options: Options) => {
  let pager: any = null,
    failedToStartPager = null;
  let error = false;
  let spinner;
  let db;
  try {
    spinner = ora("Authenticating Firestore DB").start();
    db = await authenticateFirestore(options);
    spinner.succeed("Successfully authenticated!");
  } catch (error) {
    spinner.fail("Failed to authenticate to Firestore DB: " + error.toString());
    process.exitCode = 1;
    process.exit();
  }
  try {
    if (collection) ({ pager, failedToStartPager } = initializePager(options));
    spinner = ora("Fetching documents from " + collection + "\n").start();
    let snapshot: null | QuerySnapshot = null;
    if (options.where?.length > 0) {
      let ref: CollectionReference | Query = db.collection(collection);
      snapshot = await handleWhereClause(ref, options.where).get();
    } else {
      snapshot = await db.collection(collection).get();
    }
    //
    if (failedToStartPager) {
      spinner.succeed("Done!");
    }
    //
    let stdOutput = null;
    if (options.json) {
      const snapArray: any[] = [];
      snapshot.forEach((doc) => snapArray.push({ [doc.id]: doc.data() }));
      stdOutput = JSON.stringify(snapArray, null, options.whiteSpace ?? 2);
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
