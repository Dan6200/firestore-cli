import { confirm, input, select } from "@inquirer/prompts";
import { Choice } from "../types-and-interfaces.mjs";
import { CLI_LOG } from "./logging.mjs";

export async function getInput(message?: string) {
  try {
    return await input({ message });
  } catch (r) {
    CLI_LOG(
      `Failed retrieving "${message ?? "input"}" from the user: ` + r.message,
      "error"
    );
    process.exitCode = 1;
  }
}

export async function yesNo(message?: string) {
  try {
    return await confirm({ message });
  } catch (r) {
    CLI_LOG(`Failed to confirm choice: ` + r.message, "error");
    process.exitCode = 1;
  }
}

export async function selectOption(
  choices: Choice<string>[],
  message?: string
) {
  try {
    return await select({ message, choices });
  } catch (r) {
    CLI_LOG(`Failed selecting options: ` + r.message, "error");
    process.exitCode = 1;
  }
}
