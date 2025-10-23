import { exec, execSync } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const execAsync = promisify(exec);

// --- Test Configuration ---
// Ensure the FIRESTORE_EMULATOR_HOST environment variable is set before running.
// Example: export FIRESTORE_EMULATOR_HOST="localhost:8080"
const PROJECT_ID = "firestore-cli-test"; // Use a dedicated test project ID
const CLI_COMMAND = `pnpm start --project-id ${PROJECT_ID}`;
const TEST_COLLECTION = "e2e_test_users";

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
    await run(`${CLI_COMMAND} set ${TEST_COLLECTION} --file ${tempFilePath} --bulk`);
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

    const { stdout } = await run(`${queryCommand} | ${deleteCommand}`);

    // Assert that the delete command reported success for the correct number of docs
    expect(stdout).toContain("Successfully deleted 2 document(s).");

    // Verify that the documents were actually deleted
    const { stdout: getBob } = await run(
      `${CLI_COMMAND} get ${TEST_COLLECTION}/user_b --json`,
    );
    expect(getBob.trim()).toBe("[]");

    const { stdout: getCharlie } = await run(
      `${CLI_COMMAND} get ${TEST_COLLECTION}/user_c --json`,
    );
    expect(getCharlie.trim()).toBe("[]");

    // Verify that other documents were not deleted
    const { stdout: getAlice } = await run(
      `${CLI_COMMAND} get ${TEST_COLLECTION}/user_a --json`,
    );
    expect(JSON.parse(getAlice).name).toBe("Alice");
  }, 30000); // Increase timeout for E2E test
});
