import { execSync, spawn, ChildProcess } from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";

// Define a path for the test data
const DATA_DIR = resolve(__dirname, "data");

describe("E2E Tests", () => {
  let emulatorProcess: ChildProcess;

  // Set a long timeout for the entire suite to allow for emulator start and data seeding
  jest.setTimeout(60000); 

  beforeAll(async () => {
    // 1. Start the Firestore Emulator
    console.log("Starting Firestore emulator...");
    emulatorProcess = spawn("gcloud", [
      "emulators",
      "firestore",
      "start",
      "--host-port=localhost:8080",
    ]);

    // 2. Wait for the emulator to be ready
    await new Promise<void>((resolvePromise) => {
      emulatorProcess.stdout?.on("data", (data) => {
        if (data.toString().includes("[firestore] Dev App Server is running")) {
          console.log("Firestore emulator is running.");
          resolvePromise();
        }
      });
      emulatorProcess.stderr?.on("data", (data) => {
        console.error(`Emulator stderr: ${data}`);
      });
    });

    // 3. Seed the database with the 'lite' dataset
    console.log("Seeding database with lite dataset...");
    try {
      execSync(`bash ${DATA_DIR}/upload-lite.sh`);
      console.log("Database seeded successfully.");
    } catch (error) {
      console.error("Failed to seed database:", error.message);
      // Kill the emulator if seeding fails
      emulatorProcess.kill();
      throw error;
    }
  });

  afterAll(() => {
    // 4. Shut down the emulator
    console.log("Shutting down Firestore emulator...");
    if (emulatorProcess) {
      emulatorProcess.kill();
    }
  });

  test("should get all documents from a collection", () => {
    console.log("Running test: should get all documents...");
    // Get the original data to compare against
    const originalData = JSON.parse(
      readFileSync(`${DATA_DIR}/residents/data.json`, "utf-8")
    );

    // Run the CLI command to get the documents as JSON
    const cliOutput = execSync(
      "firestore-cli get providers/test-provider/residents --json"
    ).toString();
    const parsedOutput = JSON.parse(cliOutput);

    // Assert that the number of documents matches
    expect(parsedOutput.length).toBe(originalData.length);
    console.log("Test passed: Document count matches.");
  });

  test("should delete a document and verify its removal", () => {
    console.log("Running test: should delete a document...");
    const residentIdToDelete = "0f3acca9-b52c-4447-a32c-df90ab55290c";
    const docPath = `providers/test-provider/residents/${residentIdToDelete}`;

    // Run the delete command
    execSync(`firestore-cli delete ${docPath}`);
    console.log(`Attempted to delete document: ${docPath}`);

    // Try to get the deleted document
    const cliOutput = execSync(
      `firestore-cli get ${docPath} --json`
    ).toString();
    const parsedOutput = JSON.parse(cliOutput);

    // Assert that the result is an empty array, confirming deletion
    expect(parsedOutput).toEqual([]);
    console.log("Test passed: Document successfully deleted.");
  });
});
