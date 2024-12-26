//cspell:disable
import { Command } from "commander";
import get from "./get";
export const program = new Command();

program
  .command("get <collection>")
  .option(
    "--print-depth=<VALUE>",
    "Control the depth of the results objects",
    parseInt,
    3
  )
  .description("Fetch documents from a collection")
  .action(get);
