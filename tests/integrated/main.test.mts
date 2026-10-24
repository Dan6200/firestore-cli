import { jest } from "@jest/globals";
import { execSync } from "child_process";
import { readFileSync } from "fs";

// Define a path for the test data
const DATA_DIR = "tests/data";

describe("Integrated Tests: Read and Mutate", () => {
  // Set a long timeout for the entire suite to allow for emulator start and data seeding
  jest.setTimeout(120000); // 2 minutes

  beforeEach(() => {
    // Reseed before every test so mutations don't leak between tests.
    try {
      execSync(`bash ${DATA_DIR}/upload-lite.sh`);
    } catch (error) {
      throw error;
    }
  });

  test("should get all documents from a collection", () => {
    const originalData = JSON.parse(readFileSync(`${DATA_DIR}/residents/data.json`, "utf-8"));

    const cliOutput = execSync("./built/main.mjs get providers/test-provider/residents --no-pager --json", {
      stdio: ["inherit", "pipe", "pipe"], // ignore stdin to prevent hangs, pipe out/err
      encoding: "utf-8", // this makes the return value a string, not a Buffer
    });
    const parsedOutput = JSON.parse(cliOutput);

    expect(parsedOutput.length).toBe(originalData.length);
  });

  test("should create a document and read it back", () => {
    const colPath = "test_created";

    execSync(
      `./built/main.mjs set ${colPath} '{"id":"doc_a","name":"Alice","age":30}' --no-merge`,
    );

    const cliOutput = execSync(
      `./built/main.mjs get ${colPath}/doc_a --json`,
    ).toString();

    expect(JSON.parse(cliOutput)).toEqual({
      id: "doc_a",
      data: { name: "Alice", age: 30 },
    });
  });

  test("should bulk-create a collection from an existing data file", () => {
    const colPath = "test_bulk_created";
    const fixturePath = `${DATA_DIR}/observations/data.json`;
    const fixtureData = JSON.parse(readFileSync(fixturePath, "utf-8"));

    execSync(`./built/main.mjs set ${colPath} -b -f ${fixturePath} --no-merge`);

    const cliOutput = execSync(
      `./built/main.mjs get ${colPath} --no-pager --json`,
      { maxBuffer: 64 * 1024 * 1024 },
    ).toString();

    expect(JSON.parse(cliOutput)).toHaveLength(fixtureData.length);
  });

  test("should update an existing document with --merge", () => {
    // beforeEach seeds `providers/test-provider/residents` from this fixture.
    const [fixture] = JSON.parse(
      readFileSync(`${DATA_DIR}/residents/data.json`, "utf-8"),
    );
    const colPath = "providers/test-provider/residents";
    const updatedName = "Updated Resident";

    // In-memory update: only the fields supplied should change.
    execSync(
      `./built/main.mjs set ${colPath} '${JSON.stringify({
        id: fixture.id,
        resident_name: updatedName,
      })}' --merge`,
    );

    const cliOutput = execSync(
      `./built/main.mjs get ${colPath}/${fixture.id} --json`,
    ).toString();
    const parsedOutput = JSON.parse(cliOutput);

    expect(parsedOutput.data.resident_name).toBe(updatedName);
    // Fields not mentioned in the update must be preserved.
    expect(parsedOutput.data.gender).toBe(fixture.data.gender);
    expect(parsedOutput.data.facility_id).toBe(fixture.data.facility_id);
  });

  test("should delete a document and verify its removal", () => {
    const residentIdToDelete = "0f3acca9-b52c-4447-a32c-df90ab55290c";
    const docPath = `providers/test-provider/residents/${residentIdToDelete}`;

    // Run the delete command
    execSync(`./built/main.mjs delete ${docPath}`);

    // Try to get the deleted document
    const cliOutput = execSync(`./built/main.mjs get ${docPath} --json`).toString();
    const parsedOutput = JSON.parse(cliOutput);

    // A deleted document is still returned by id, but has no data.
    expect(parsedOutput).toEqual({ id: residentIdToDelete });
  });

  test("should delete a collection and verify its removal", () => {
    const originalData = JSON.parse(readFileSync(`${DATA_DIR}/residents/data.json`, "utf-8"));
    const colPath = `providers/test-provider/residents/nested/residents`;
    const parentColPath = `providers/test-provider/residents`;

    execSync(`./built/main.mjs delete --recurse ${colPath}`);

    {
      const cliOutput = execSync(`./built/main.mjs get ${colPath} --json`).toString();
      const parsedOutput = JSON.parse(cliOutput);

      // Assert that the result is an empty array, confirming deletion
      expect(parsedOutput).toEqual([]);
    }

    {
      // Parent docs must be unaffected...
      const cliOutput = execSync(`./built/main.mjs get ${parentColPath} --json`).toString();
      const parsedOutput = JSON.parse(cliOutput);

      expect(parsedOutput.length).toEqual(originalData.length);
    }
  });

  test("should recursively delete all subcollections", () => {
    const colPath = `providers/test-provider/residents`;
    const subColPath = `providers/test-provider/residents/nested/residents`;

    // Run the delete command
    execSync(`./built/main.mjs delete --recurse ${colPath}`);

    const cliOutput = execSync(`./built/main.mjs get ${colPath} --json`).toString();
    const parsedOutput = JSON.parse(cliOutput);

    const cliOutput2 = execSync(`./built/main.mjs get ${subColPath} --json`).toString();
    const parsedOutput2 = JSON.parse(cliOutput2);

    // Assert that the result is an empty array, confirming deletion
    expect(parsedOutput).toEqual([]);
    expect(parsedOutput2).toEqual([]);
  });
});
