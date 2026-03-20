import ora from "ora";
import { Options } from "commander";
import { authenticateFirestore } from "../auth/authenticate-firestore.mjs";
import { CLI_LOG } from "../utils/logging.mjs";
import { getCollectionReference } from "../utils/get-firestore-reference.mjs";
import handleWhereClause from "./utils/where-clause-parsing.mjs";
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
    let query = handleWhereClause(ref, options.where);
    // 1. Order By (Must come before cursors)
    if (options.asc) {
      for (const a of options.asc) {
        query = query.orderBy(a, "asc");
      }
    }
    if (options.desc) {
      for (const d of options.desc) {
        query = query.orderBy(d, "desc");
      }
    }

    // 2. Cursors
    if (options.startAfter) query = query.startAfter(...options.startAfter);
    if (options.startAt) query = query.startAt(...options.startAt);
    if (options.endAt) query = query.endAt(...options.endAt);
    if (options.startAfter) query = query.startAfter(...options.startAfter);
    if (options.endBefore) query = query.endBefore(...options.endBefore);

    // 3. Limit
    if (options.limit) query = query.limit(options.limit);

    // Make Query...
    const docs = await query.get();
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

