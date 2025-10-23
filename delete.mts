//cspell:disable
import ora from "ora";
import { Options } from "commander";
import { CLI_LOG } from "./utils/logging.mjs";
import { authenticateFirestore } from "./auth/authenticate-firestore.mjs";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { existsSync } from "fs";

// Helper function to read from stdin
function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

export default async (path: string, options: Options) => {
  const spinner = ora("Deleting document(s)...
").start();
  try {
    const db = await authenticateFirestore(options);
    let pathsToDelete: string[] = [];

    // 1. Check stdin
    if (!process.stdin.isTTY) {
      spinner.text = "Reading document paths from stdin...";
      const stdinData = await readStdin();
      if (stdinData) {
        pathsToDelete = stdinData.split("\n").filter((p) => p.trim());
      }
    }
    // 2. Check --file
    else if (options.file) {
      spinner.text = `Reading document paths from file: ${options.file}...`;
      const inputFile = options.file;
      if (!existsSync(inputFile)) {
        throw new Error(`Invalid file path for the --file option: ${inputFile}`);
      }
      const fileContent = await readFile(resolve(inputFile), "utf8");
      if (fileContent) {
        pathsToDelete = fileContent.split("\n").filter((p) => p.trim());
      }
    }
    // 3. Fallback to path argument
    else {
      if (path) {
        pathsToDelete.push(path);
      } else {
        throw new Error(
          "A document path or file is required when not reading from stdin.",
        );
      }
    }

    if (pathsToDelete.length === 0) {
      spinner.succeed("No documents to delete.");
      return;
    }

    spinner.text = `Deleting ${pathsToDelete.length} document(s)...`;

    const bulkWriterOptions: { 
      throttling?: { maxOpsPerSecond: number };
    } = {};
    if (options.rateLimit) {
      bulkWriterOptions.throttling = {
        maxOpsPerSecond: options.rateLimit,
      };
    }
    const bulkWriter = db.bulkWriter(bulkWriterOptions);

    for (const docPath of pathsToDelete) {
      bulkWriter.delete(db.doc(docPath));
    }

    await bulkWriter.close();

    spinner.succeed(`Successfully deleted ${pathsToDelete.length} document(s).`);
  } catch (e) {
    spinner.fail("Failed to delete document(s)!");
    CLI_LOG(e.message, "error");
    process.exitCode = 1;
  }
};
