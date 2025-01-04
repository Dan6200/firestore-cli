//cspell:disable
import { Chalk } from "chalk";
import ora from "ora";
import { Options } from "commander";
import { authenticateFirestore } from "./auth-1.mjs";
import { handleSecretKey } from "./utils/auth.mjs";
import { printDocuments } from "./utils/print.mjs";
import {
  CollectionReference,
  Query,
  QuerySnapshot,
} from "firebase-admin/firestore";
import { initializePager } from "./init-pager.mjs";

const chalk = new Chalk({ level: 3 });

export default async (
  globalOptions: Options,
  collection: string,
  options: Options
) => {
  let pager = null,
    failedToStartPager = null;
  if (collection) ({ pager, failedToStartPager } = initializePager());
  const spinner = ora("Fetching documents from " + collection + "\n").start();
  try {
    const serviceAccount = handleSecretKey(globalOptions.serviceAccount);
    const db = await authenticateFirestore(
      serviceAccount,
      globalOptions.databaseId
    );
    let snapshot: null | QuerySnapshot = null;
    if (options.where) {
      let ref: CollectionReference | Query = db.collection(collection);
      //snapshot = await handleWhereClause(ref, options.where).get();
    } else {
      snapshot = await db.collection(collection).get();
    }

    if (snapshot.empty) {
      spinner.succeed("Done!");
      console.log("[]");
      return;
    }
    if (failedToStartPager) {
      spinner.succeed("Done!");
    }

    let stdOutput = null;
    if (options.json) {
      const snapArray = [];
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
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!failedToStartPager) pager.stdin.write(stdOutput);
  } catch (e) {
    spinner.fail("Failed to fetch documents!");
    console.error(e);
  } finally {
    if (!failedToStartPager) pager.stdin.end();
  }
};
