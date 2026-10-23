import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const execAsync = promisify(exec);

// --- Test Configuration ---
// FIRESTORE_EMULATOR_HOST is provided by `firebase emulators:exec`.
const PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  "demo-no-project";
const CLI_COMMAND = `./built/main.mjs`;
const TEST_COLLECTION = "test_users";

// --- Helper Functions ---
const run = async (command: string) => {
  try {
    return await execAsync(command);
  } catch (e) {
    // Log stdout/stderr for debugging failed commands
    console.error(`Command failed: ${command}`);
    console.error("STDOUT:", e.stdout);
    console.error("STDERR:", e.stderr);
    throw e;
  }
};

const clearEmulatorData = async () => {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (!emulatorHost) return; // Don't clear if not using emulator
  const url = `http://${emulatorHost}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  try {
    await fetch(url, { method: "DELETE" });
  } catch (error) {
    console.error("Failed to clear emulator data:", error);
  }
};

// --- Test Data ---
const testDocs = [
  { id: "user_a", data: { status: "active", name: "Alice" } },
  { id: "user_b", data: { status: "to_be_deleted", name: "Bob" } },
  { id: "user_c", data: { status: "to_be_deleted", name: "Charlie" } },
  { id: "user_d", data: { status: "active", name: "Diana" } },
];

// --- Test Suite ---
describe("E2E: CLI Piping", () => {
  let tempFilePath: string;

  beforeAll(async () => {
    // 1. Clear any previous test data
    await clearEmulatorData();

    // 2. Create a temporary file with test data for seeding
    tempFilePath = join(tmpdir(), `test-data-${Date.now()}.json`);
    writeFileSync(tempFilePath, JSON.stringify(testDocs));

    // 3. Seed the database using the 'set' command
    await run(
      `${CLI_COMMAND} set ${TEST_COLLECTION} --file ${tempFilePath} --bulk`,
    );
  }, 30000); // Increase timeout for setup

  afterAll(async () => {
    // 5. Clean up the temporary file and emulator data
    if (tempFilePath) {
      unlinkSync(tempFilePath);
    }
    await clearEmulatorData();
  });

  it("should query for documents and pipe their paths to the delete command", async () => {
    // 4. Execute the piped command
    const queryCommand = `${CLI_COMMAND} query ${TEST_COLLECTION} --where "status" "==" "to_be_deleted"`;
    const deleteCommand = `${CLI_COMMAND} delete`;

    const result = await run(`${queryCommand} | ${deleteCommand}`);

    // Spinner/status output goes to stderr, so check both streams.
    // Assert that the delete command reported success for the correct number of docs
    expect(result.stdout + result.stderr).toContain(
      "Successfully deleted 2 document(s).",
    );

    // Verify that the documents were actually deleted. A missing document is
    // returned with its id and no data.
    const { stdout: getBob } = await run(
      `${CLI_COMMAND} get ${TEST_COLLECTION}/user_b --json`,
    );
    expect(JSON.parse(getBob)).toEqual({ id: "user_b" });

    const { stdout: getCharlie } = await run(
      `${CLI_COMMAND} get ${TEST_COLLECTION}/user_c --json`,
    );
    expect(JSON.parse(getCharlie)).toEqual({ id: "user_c" });

    // Verify that other documents were not deleted
    const { stdout: getAlice } = await run(
      `${CLI_COMMAND} get ${TEST_COLLECTION}/user_a --json`,
    );
    expect(JSON.parse(getAlice).data.name).toBe("Alice");
  }, 30000); // Increase timeout for test
});
