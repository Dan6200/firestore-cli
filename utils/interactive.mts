import { createInterface } from "readline/promises";
import { CLI_LOG } from "./logging.mjs";

export async function getInput(prompt?: string) {
  let rl;
  try {
    rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const ID = await rl.question(`${prompt ?? ""}: `);
    return ID;
  } catch (e) {
    CLI_LOG(`Failed retrieving ${prompt ?? ""} from the user: ` + e);
    throw e;
  } finally {
    rl?.close();
  }
}
