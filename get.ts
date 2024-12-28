//cspell:disable
import { Chalk } from "chalk";
import ora from "ora";
import { Command, Options } from "commander";
import { authenticateFirestore } from "./auth-1.js";
import { handleSecretKey, handleWhereClause, printObj } from "./utils.js";
import { spawn } from "child_process";

const chalk = new Chalk({ level: 3 });
const less = spawn("less", ["-R"], { stdio: ["pipe", "inherit", "inherit"] });
let failedToStartLess = false;
less.on("error", () => {
  failedToStartLess = true;
  console.error(
    "Could not find less installed on your system. Printing directly to stdout instead\n"
  );
});
let stdOutput = "";

export default async (collection: string, options: Options) => {
  const spinner = ora("Fetching documents from " + collection + "\n").start();
  try {
    const secretKey = handleSecretKey(options.secretKey);
    const db = await authenticateFirestore(secretKey, options.databaseId);
    let snapshot = null;
    if (options.where) {
      snapshot = await handleWhereClause(db, collection, options.where).get();
    } else {
      snapshot = await db.collection(collection).get();
    }

    if (snapshot.empty) {
      spinner.succeed("Done!"); // I can't see the check mark, less starts immediately
      console.log("[]\n");
      return;
    }
    const INDENT = "    ";
    if (failedToStartLess) {
      spinner.succeed("Done!");
      console.log("[\n");
    } else stdOutput += "[\n";
    let docCount = 1;
    snapshot.forEach((doc) => {
      if (docCount !== snapshot.size) {
        const output = `${INDENT + doc.id} => ${printObj(
          doc.data(),
          undefined,
          INDENT,
          chalk
        )},\n`;
        if (failedToStartLess) console.log(output);
        else stdOutput += output;
      } else {
        const output = `${INDENT + doc.id} => ${printObj(
          doc.data(),
          undefined,
          INDENT,
          chalk
        )}\n`;
        docCount++;
        if (failedToStartLess) console.log(output);
        else stdOutput += output;
      }
    });
    if (failedToStartLess) console.log("]\n");
    else {
      stdOutput += "]\n";
      spinner.succeed("Done!");
    }
    if (!failedToStartLess) less.stdin.write(stdOutput);
  } catch (e) {
    spinner.fail("Failed to fetch documents!");
    console.error(e);
  } finally {
    if (!failedToStartLess) less.stdin.end();
  }
};
