import ora from "ora";
import { Options } from "commander";
import { authenticateFirestore } from "../auth/authenticate-firestore.mjs";
import { CLI_LOG } from "../utils/logging.mjs";
import { getCollectionReference } from "../utils/get-firestore-reference.mjs";
import handleWhereClause from "./utils.mjs";
import { initializePager } from "../pager/init.mjs";

export default async (collection: string, options: Options) => {
  let spinner;
  let db = null;
  try {
    spinner = ora("Authenticating Firestore DB").start();
    db = await authenticateFirestore(options);
    spinner.succeed("Successfully authenticated!");

    spinner.start("Querying documents...");
    const ref = getCollectionReference(db, collection);
    const q = handleWhereClause(ref, options.where);
    const docs = await q.get();
    spinner.succeed(`Found ${docs.size} document(s).`);

    if (docs.empty) return;

    process.stdout.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EPIPE") {
        process.exit(0);
      }
    });

    // Check if output is to a terminal or a pipe
    if (process.stdout.isTTY) {
      // --- Interactive Mode: Use Pager ---
      const { pager, failedToStartPager } = initializePager(options);

      if (failedToStartPager) {
        // Fallback for when pager fails: print directly
        docs.forEach((doc) => {
          process.stdout.write(doc.ref.path + "\n");
        });
        return;
      }

      // Graceful exit setup
      if (pager) {
        pager.stdin.on("error", (err: NodeJS.ErrnoException) => {
          if (err.code === "EPIPE") {
            process.exit(0);
          }
        });
      }
      const pagerClosed = pager
        ? new Promise<void>((resolve) => {
            pager.on("close", () => resolve());
          })
        : Promise.resolve();

      // Build the full string of paths
      const pathList = docs.docs.map((doc) => doc.ref.path).join("\n");

      // Write to pager and wait for it to close
      if (pager) {
        pager.stdin.write(pathList + "\n");
        pager.stdin.end();
      }
      await pagerClosed;
    } else {
      // --- Piped Mode: Print raw paths ---
      docs.forEach((doc) => {
        process.stdout.write(doc.ref.path + "\n");
      });
    }
    process.exitCode = 0;
  } catch (error) {
    if (spinner) spinner.fail("An error occurred.");
    CLI_LOG(error.message, "error");
    process.exitCode = 1;
  } finally {
    await db?.terminate();
    process.stdout.write("", () => {
      process.exit(process.exitCode || 0);
    });
    process.stdout.end();
  }
};

