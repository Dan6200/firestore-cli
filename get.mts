//cspell:disable
import { Chalk } from "chalk";
import ora from "ora";
import { Options } from "commander";
import { authenticateFirestore } from "./auth/service-account.mjs";
import { handleSecretKey } from "./utils/auth.mjs";
import { printDocuments } from "./utils/print.mjs";
import {
  CollectionReference,
  Query,
  QuerySnapshot,
} from "firebase-admin/firestore";
import { initializePager } from "./init-pager.mjs";
import handleWhereClause from "./utils/handle-where-clause.mjs";
import { CLI_LOG } from "./utils/logging.mjs";

const chalk = new Chalk({ level: 3 });

export default async (
  globalOptions: Options,
  collection: string,
  options: Options
) => {
  let pager: any = null,
    failedToStartPager = null;
  if (collection) ({ pager, failedToStartPager } = initializePager());
  const spinner = ora("Fetching documents from " + collection + "\n").start();
  try {
    const db = authenticateHelper(globalOptions);
    let snapshot: null | QuerySnapshot = null;
    if (options.where?.length > 0) {
      let ref: CollectionReference | Query = db.collection(collection);
      snapshot = await handleWhereClause(ref, options.where).get();
    } else {
      snapshot = await db.collection(collection).get();
    }

    if (snapshot?.empty) {
      spinner.succeed("Done!");
      process.stdout.write("[]");
      return;
    }
    if (failedToStartPager) {
      spinner.succeed("Done!");
    }

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
        options.whiteSpace
      );
    if (!failedToStartPager) {
      spinner.succeed("Done!");
      //await new Promise(() => setTimeout(() => null, 250));
    }
    if (!failedToStartPager) pager.stdin.write(stdOutput);
  } catch (e) {
    spinner.fail("Failed to fetch documents!");
    CLI_LOG(e.toString(), "error");
  } finally {
    if (!failedToStartPager) pager.stdin.end();
  }
};
