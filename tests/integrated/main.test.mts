import { jest } from "@jest/globals";
import { execSync } from "child_process";
import { readFileSync } from "fs";

// Define a path for the test data
const DATA_DIR = "tests/integrated/data";

describe("Integrated Tests", () => {
  // Set a long timeout for the entire suite to allow for emulator start and data seeding
  jest.setTimeout(120000); // 2 minutes

  beforeAll(() => {
    // Seeding the database...
    try {
      execSync(`bash ${DATA_DIR}/upload-lite.sh`);
    } catch (error) {
      throw error;
    }
  });

  test("should get all documents from a collection", () => {
    const originalData = JSON.parse(
      readFileSync(`${DATA_DIR}/residents/data.json`, "utf-8"),
    );

    const cliOutput = execSync(
      "./built/main.mjs get providers/test-provider/residents --no-pager --json",
      {
        stdio: ["inherit", "pipe", "pipe"], // ignore stdin to prevent hangs, pipe out/err
        encoding: "utf-8", // this makes the return value a string, not a Buffer
      },
    );
    const parsedOutput = JSON.parse(cliOutput);

    expect(parsedOutput.length).toBe(originalData.length);
  });

  test("should delete a document and verify its removal", () => {
    const residentIdToDelete = "0f3acca9-b52c-4447-a32c-df90ab55290c";
    const docPath = `providers/test-provider/residents/${residentIdToDelete}`;

    // Run the delete command
    execSync(`./built/main.mjs delete ${docPath}`);

    // Try to get the deleted document
    const cliOutput = execSync(
      `./built/main.mjs get ${docPath} --json`,
    ).toString();
    const parsedOutput = JSON.parse(cliOutput);

    // Assert that the result is an empty array, confirming deletion
    expect(parsedOutput).toEqual([]);
  });

  test("should delete a collection and verify its removal", () => {
    const originalData = JSON.parse(
      readFileSync(`${DATA_DIR}/residents/data.json`, "utf-8"),
    );
    const colPath = `providers/test-provider/residents/nested/residents`;
    const parentColPath = `providers/test-provider/residents`;

    execSync(`./built/main.mjs delete ${colPath}`);

    {
      const cliOutput = execSync(
        `./built/main.mjs get ${colPath} --json`,
      ).toString();
      const parsedOutput = JSON.parse(cliOutput);

      // Assert that the result is an empty array, confirming deletion
      expect(parsedOutput).toEqual([]);
    }

    {
      // Parent docs must be unaffected...
      const cliOutput = execSync(
        `./built/main.mjs get ${parentColPath} --json`,
      ).toString();
      const parsedOutput = JSON.parse(cliOutput);

      expect(parsedOutput.length).toEqual(originalData.length);
    }
  });

  test("should recursively delete all subcollections", () => {
    const colPath = `providers/test-provider/residents`;
    const subColPath = `providers/test-provider/residents/nested/residents`;

    // Run the delete command
    execSync(`./built/main.mjs delete ${colPath}`);

    const cliOutput = execSync(
      `./built/main.mjs get ${colPath} --json`,
    ).toString();
    const parsedOutput = JSON.parse(cliOutput);

    const cliOutput2 = execSync(
      `./built/main.mjs get ${subColPath} --json`,
    ).toString();
    const parsedOutput2 = JSON.parse(cliOutput2);

    // Assert that the result is an empty array, confirming deletion
    expect(parsedOutput).toEqual([]);
    expect(parsedOutput2).toEqual([]);
  });
});
