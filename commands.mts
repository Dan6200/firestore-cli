import { Command } from "commander";
import set from "./set.mjs";
import get from "./get.mjs";
import query from "./query/main.mjs";
import deleteDoc from "./delete.mjs";
import whereOptionParser from "./utils/where-option-parser.mjs";
import { CLI_LOG } from "./utils/logging.mjs";
const program = new Command();

/* TODO: Big Deal!!! Replace all dynamic imports as older versions of node don't have those!!! */

try {
  program
    .name("firestore-cli")
    .description("CLI tool to query the google cloud firestore database")
    .version("1.0.8-beta.3");

  program
    .command("set [path] [new-document-data]")
    .description(
      "Set document to a path. Adds or updates documents. In the case of an update can overwrite or merge based on the --merge option.",
    )
    .option(
      "-k, --service-account-key <VALUE>",
      `Filepath to the service account key file for authentication. Can be omitted if the SERVICE_ACCOUNT_KEY or the GOOGLE_APPLICATION_CREDENTIALS env variable is set.`,
    )
    .option(
      "--database-id <VALUE>",
      "Specifies the database Id. If not specified `(default)` is used.",
    )
    .option("--project-id <VALUE>", "Set the project ID")
    .option("-b, --bulk", "Perform bulk set operations")
    .option(
      "-f --file <VALUE>",
      "Read input from a file. Unless the --file-type flag is set, the file is assumed to be in JSON format",
    )
    .option(
      "--file-type <VALUE>",
      "Specify the file type of the input file. To be used in conjunction with the --file flag",
    )
    .option("--merge", "Option to overwrite or merge existing data if any")
    .option("--no-merge", "set --merge option to false.")
    .option(
      "--rate-limit <VALUE>",
      "Sets the maximum number of operations per second for bulk writes.",
      parseInt,
    )
    .option("--debug", "Set log level to DEBUG")
    .action(set);

  program
    .command("query <collection>")
    .description("")
    .option(
      "-k, --service-account-key <VALUE>",
      `Filepath to the service account key file for authentication. Can be omitted if the SERVICE_ACCOUNT_KEY or the GOOGLE_APPLICATION_CREDENTIALS env variable is set.`,
    )
    .option("--project-id <VALUE>", "Set the project ID")
    .option(
      "--database-id <VALUE>",
      "Specifies the database Id. If not specified `(default)` is used.",
    )
    .option(
      "-w, --where [VALUE...]",
      "Specify filtering conditions for querying documents. Provide a space-separated list of arguments in the format:\n`<field> <operator> <value>`. Supported operators include: `==`, `!=`, `<`, `<=`, `>`, `>=`, `array-contains`,\n`array-contains-any`, `in`, and `not-in`. If specifying a numeric value as a string, enclose it in nested quotes.\nExample: `-w id '==' '\"22\"' and age '>' 18  or status '==' active`. When using query modifiers, such as --where, --asc, --start, --limit... order matters, learn more: https://firebase.google.com/docs/firestore/query-data/get-data",
      whereOptionParser,
    )
    // TODO: complete....
    .option(
      "-a, --asc <field>",
      "Order results in an ascending order. To be implemented soon.",
    )
    .option(
      "-d, --desc <field>",
      "Order results in an descending order. To be implemented soon.",
    )
    .option(
      "-s, --start <VALUES...>",
      "Place cursor at a list of values.\nEach value must correspond to the number of --asc/--desc flags used.\nExample: `-w id '==' 'AyuiI9=' -a age -a number_of_hobbies -s 18 2`. To be implemented soon.",
    )
    .option(
      "-e, --end <VALUES...>",
      "Place ending cursor at a list of values. See --start. To be implemented soon.",
    )
    .option(
      "-sb, --start-before <VALUES...>",
      "Place cursor before a list of values. See --start. To be implemented soon.",
    )
    .option(
      "-eb, --end-before <VALUES...>",
      "Place ending cursor before a list of values. See --start",
    )
    .option(
      "-sa, --start-after <VALUES...>",
      "Place cursor after a list of values. See --start. To be implemented soon.",
    )
    .option(
      "-ea, --end-after <VALUES...>",
      "Place ending cursor after a list of values. See --start. To be implemented soon.",
    )
    .option(
      "-l, --limit <VALUE>",
      "Limit results to `VALUE` count documents. To be implemented soon.",
    )
    .action(query);

  program
    .command("get [path]")
    .description("Fetch documents from a given path")
    .option(
      "-k, --service-account-key <VALUE>",
      `Filepath to the service account key file for authentication. Can be omitted if the SERVICE_ACCOUNT_KEY or the GOOGLE_APPLICATION_CREDENTIALS env variable is set.`,
    )
    .option("--project-id <VALUE>", "Set the project ID")
    .option(
      "--database-id <VALUE>",
      "Specifies the database Id. If not specified `(default)` is used.",
    )
    .option(
      "-f, --file <VALUE>",
      "Read a newline-separated list of document paths from a file.",
    )
    .option(
      "-ws, --white-space <VALUE>",
      "Numerical value that determines the amount of whitespace and indentation the documents should be printed with. Maximum value is 8",
      parseInt,
    )
    .option("-j, --json", "Format output in JSON format")
    .option("-np, --no-pager", "The option to print results without a pager.")
    .option(
      "--pager <VALUE>",
      "Customizes which pager should be used to read output. The default is 'less'",
      "less",
    )
    .option(
      "--pager-args [ARGS...]",
      "The arguments which should be passed to the pager",
      ["-R", "-F", "-X"],
    )
    .option("--stream", "Stream documents from Firestore one by one.")
    .option("--debug", "Set log level to DEBUG")
    .action(get);

  program
    .command("delete <path>")
    .description("Delete document(s) from a given path")
    .option(
      "-k, --service-account-key <VALUE>",
      `Filepath to the service account key file for authentication. Can be omitted if the SERVICE_ACCOUNT_KEY or the GOOGLE_APPLICATION_CREDENTIALS env variable is set.`,
    )
    .option("--project-id <VALUE>", "Set the project ID")
    .option(
      "--database-id <VALUE>",
      "Specifies the database Id. If not specified `(default)` is used.",
    )
    .option("-b, --bulk", "Perform bulk add operations")
    .option(
      "-f --file <VALUE>",
      "Read input from a file. Unless the --file-type flag is set, the file is assumed to be in JSON format",
    )
    .option(
      "--file-type <VALUE>",
      "Specify the file type of the input file. To be used in conjunction with the --file flag",
    )
    .option(
      "--rate-limit <VALUE>",
      "Sets the maximum number of operations per second for bulk deletes.",
      parseInt,
    )
    .option("--debug", "Set log level to DEBUG")
    .action(deleteDoc);
} catch (error) {
  CLI_LOG(error, "error");
}
export { program };
