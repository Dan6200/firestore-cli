//cspell:disable
import { Chalk } from "chalk";
import ora from "ora";
import { Options } from "commander";
import { authenticateFirestore } from "./auth-1.js";
import {
  handleSecretKey,
  handleWhereClause,
  printDocuments,
} from "./utils.mjs";
import {
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
} from "firebase-admin/firestore";
import { failedToStartLess, less } from "./init-less.js";

const chalk = new Chalk({ level: 3 });

export default async (
  globalOptions: Options,
  collection: string,
  newDocumentData: string,
  options: Options
) => {
  const spinner = ora("Adding document(s) to " + collection + "\n").start();
  try {
    const secretKey = handleSecretKey(globalOptions.secretKey);
    const db = await authenticateFirestore(secretKey, globalOptions.databaseId);
    let docRef: null | DocumentReference = null;
    docRef = await db.collection(collection).add(JSON.parse(newDocumentData));
    let snapshot: null | DocumentSnapshot = null;
    if (docRef) {
      snapshot = await docRef.get();
    } else {
      throw new Error("Error adding document");
    }
    if (failedToStartLess) {
      spinner.succeed("Done!");
    }

    let stdOutput = null;
    if (options.json) {
      const snapObj = {
        id: snapshot.id,
        createTime: snapshot.createTime.seconds,
        data: snapshot.data(),
      };
      stdOutput = JSON.stringify(snapObj, null, options.whiteSpace ?? 2);
      if (failedToStartLess) process.stdout.write(stdOutput);
    } else
      stdOutput = printDocuments(
        snapshot,
        chalk,
        failedToStartLess,
        options.whiteSpace
      );
    if (!failedToStartLess) {
      spinner.succeed("Done!\n");
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!failedToStartLess) less.stdin.write(stdOutput);
  } catch (e) {
    spinner.fail("Failed to fetch documents!");
    console.error(e);
  } finally {
    if (!failedToStartLess) less.stdin.end();
  }
};
