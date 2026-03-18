import { spawn } from "node:child_process";
import fs from "node:fs";
import ora from "ora";
import chalk from "chalk";
import { authenticateFirestore } from "./built/auth/authenticate-firestore.mjs";

const mode = process.argv[2];

// Helper to make the data "heavy" with ANSI codes
const colorize = (text) =>
  chalk.blue.bold("ID: ") + chalk.yellow(text) + chalk.green(" [READY]");

if (mode === "produce") {
  const spinner = ora(chalk.cyan("Producer: Initializing...")).start();

  try {
    const db = await authenticateFirestore({});
    spinner.text = chalk.magenta("Producer: Fetching from Firestore...");

    const docs = await db.collection("residents").get();
    // We send raw paths, but maybe with some chalk flavor if your real app does that
    const residentPaths = docs.docs.map((doc) => doc.ref.path);

    spinner.succeed(
      chalk.green.bold(`Producer: Dispatched ${residentPaths.length} paths.`),
    );

    process.stdout.write(residentPaths.join("\n"), () => {
      process.exit(0);
    });
  } catch (err) {
    spinner.fail(chalk.red("Producer died."));
    process.exit(1);
  }
} else if (mode === "consume") {
  let inputData = "";
  // 1. Keep the spinner purely for the "Pipe & Auth" phase
  const spinner = ora(chalk.yellow("Consumer: Buffering pipe...")).start();

  process.stdin.on("data", (chunk) => {
    inputData += chunk;
  });

  process.stdin.on("end", async () => {
    try {
      spinner.text = chalk.blue("Consumer: Authenticating...");
      const db = await authenticateFirestore({});
      const paths = inputData.split("\n").filter(Boolean);

      // 2. STOP THE SPINNER COMPLETELY
      // This relinquishes the TTY so the pager can have it.
      spinner.succeed(chalk.green(`Ready to view ${paths.length} records.`));

      // 3. NOW OPEN THE PAGER
      const ttyFd = fs.openSync("/dev/tty", "r+");
      const pager = spawn("less", ["-R"], {
        stdio: ["pipe", ttyFd, ttyFd],
      });

      // 4. STREAM DATA (Memory Safe)
      // We fetch one by one and pipe to pager.stdin immediately.
      for (const path of paths) {
        const doc = await db.doc(path).get();
        if (doc.exists) {
          const record =
            colorize(JSON.stringify(doc.data(), null, 2)) +
            chalk.red("\n--- NEXT RECORD ---\n");

          const canWrite = pager.stdin.write(record);
          if (!canWrite) {
            await new Promise((r) => pager.stdin.once("drain", r));
          }
        }
      }

      // 5. CLEANUP
      pager.stdin.end();

      await new Promise((resolve) => {
        pager.on("exit", () => {
          fs.closeSync(ttyFd);
          console.error(chalk.dim("Consumer: Pager closed."));
          resolve();
        });
      });
    } catch (err) {
      spinner.fail(chalk.bgRed(" ERROR "));
      console.error(err);
    }
  });
}
