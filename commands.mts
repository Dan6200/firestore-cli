import { Command } from "commander";
import add from "./add.mjs";
import get from "./get.mjs";
import update from "./update.mjs";
import deleteDoc from "./delete.mjs";
import whereOptionParser from "./utils/where-option-parser.mjs";
import { CLI_LOG } from "./utils/logging.mjs";
import { configureEnv } from "./configure-env.mjs";
import { setProject } from "./set-project.mjs";
import { enableFirestoreAndLinkBilling } from "./enable-firestore-and-link-billing.mjs";
import { SERVICE_ACCOUNT } from "./auth/file-paths.mjs";
import { createServiceAccountWithKey } from "./create-service-account.mjs";
const program = new Command();

try {
  program
    .name("firestore-cli")
    .description("CLI tool to query google cloud firebase firestore database")
    .version("1.0.0")
    .option("--credentials <VALUE>")
    .option("--database-id <VALUE>", "Specifies the database Id")
    .option(
      "--pager <VALUE>",
      "Customizes which pager should be used to read output. The default is 'less'"
    )
    .option(
      "--pager-args [ARGS...]",
      "The arguments which should be passed to the pager"
    );

  program
    .command("init")
    .description(
      "Walk through to set up Firestore CLI for your project. Configures environment then sets up project to be used with Firestore CLI."
    );

  program
    .command("configure-env")
    .description("Configures the environment for Firestore CLI.")
    .action(configureEnv);

  program
    .command("set-project <project-id>")
    .description("Sets the project to be used with Firestore CLI.")
    .option(
      "--createProject",
      "Creates a project with the ID `project-id` passed in as the argument to this command. Else it finds the existing project with ID `project-id`. To be used in conjunction with the --projectName flag"
    )
    .option(
      "--projectName <VALUE>",
      "The project name of the project to be created. Must be used in conjunction with the --createProject flag."
    )
    .action(setProject);

  program
    .command("enable-firestore <project-id>")
    .description(
      "Enables firestore for the project. To be used in conjunction with the --billing-account-id or the --no-link-billing flag."
    )
    .option(
      "--billing-account-id",
      "Provides the billing account ID to enable cloud billing for firestore."
    )
    .option(
      "--no-link-billing",
      "Option to create firestore database without linking billing account. If creating additional databases other than `(default)`, a billing account must be set."
    )
    .option(
      "--location-id <VALUE>",
      "Location to set the new database. Example: --location-id nam5"
    )
    .action(enableFirestoreAndLinkBilling);

  program
    .command("service-account-create <project-id>")
    .description(
      `Creates a new service account and generate a new service account key. Saves the key file at \`${SERVICE_ACCOUNT}\`.`
    )
    .option("--overwrite", "Overwrite any existing service account key if any")
    .action(createServiceAccountWithKey);

  program
    .command("add <collection> [new-document-data]")
    .option(
      "--service-account <VALUE>",
      `Filepath to the service account JSON key file for authentication.\nIf this is not provided then the program looks for the Service Account key in the \`${SERVICE_ACCOUNT}\` directory.`
    )
    .option("-b, --bulk", "Perform bulk add operations")
    .option(
      "-f --file <VALUE>",
      "Read input from a file. Unless the --file-type flag is set, the file is assumed to be in JSON format"
    )
    .option(
      "--file-type <VALUE>",
      "Specify the file type of the input file. To be used in conjunction with the --file flag"
    )
    .option(
      "--custom-id <VALUE>",
      "Allows the customization of the document id for the addition of a single document."
    )
    .option(
      "--custom-ids [VALUE...]",
      "Allows the customization of the document id for bulk addition of documents. Must be used in conjunction with the --bulk flag or an error occurs"
    )
    .description("Add document to a collection")
    .action(add.bind(null, program.opts()));

  program
    .command("get <collection>")
    .option(
      "--service-account <VALUE>",
      `Filepath to the service account JSON key file for authentication.\nIf this is not provided then the program looks for the Service Account key in the \`${SERVICE_ACCOUNT}\` directory.`
    )
    .option(
      "-w, --where [VALUE...]",
      "Specify filtering conditions for querying documents. Provide a space-separated list of arguments in the format:\n`<field> <operator> <value>`. Supported operators include: `==`, `!=`, `<`, `<=`, `>`, `>=`, `array-contains`,\n`array-contains-any`, `in`, and `not-in`. If specifying a numeric value as a string, enclose it in nested quotes.\nExample: `-w id '==' '\"22\"' and age '>' 18  or status '==' active`",
      whereOptionParser
    )
    .option(
      "-ws, --white-space <VALUE>",
      "Numerical value that determines the amount of whitespace and indentation the documents should be printed with. Maximum value is 8",
      parseInt
    )
    .option("-j, --json", "Format output in JSON format")
    .description("Fetch documents from a collection")
    .action(get.bind(null, program.opts()));

  program
    .command("update <collection> [data] [document-id...]")
    .option(
      "--service-account <VALUE>",
      `Filepath to the service account JSON key file for authentication.\nIf this is not provided then the program looks for the Service Account key in the \`${SERVICE_ACCOUNT}\` directory.`
    )
    .option("-b, --bulk", "Perform bulk update operations")
    .option(
      "-f --file <VALUE>",
      "Read input from a file.\nData is in the form of an object with the keys being the document IDs of the document(s) to be updated and the value being the new data.\nUnless the --file-type flag is set, the file is assumed to be in JSON format"
    )
    .option(
      "--file-type <VALUE>",
      "Specify the file type of the input file. To be used in conjunction with the --file flag"
    )
    .option(
      "-o, --overwrite",
      "Update the document by replace its existing data"
    )
    .description("Update document in a collection")
    .action(update.bind(null, program.opts()));

  program
    .command("delete <collection> [document-ids...]")
    .option("-b, --bulk", "Perform bulk add operations")
    .option(
      "--service-account <VALUE>",
      `Filepath to the service account JSON key file for authentication.\nIf this is not provided then the program looks for the Service Account key in the \`${SERVICE_ACCOUNT}\` directory.`
    )
    .option(
      "-f --file <VALUE>",
      "Read input from a file. Unless the --file-type flag is set, the file is assumed to be in JSON format"
    )
    .option(
      "--file-type <VALUE>",
      "Specify the file type of the input file. To be used in conjunction with the --file flag"
    )
    .description("Delete document(s) from a collection")
    .action(deleteDoc.bind(null, program.opts()));
} catch (error) {
  CLI_LOG("Encountered an error!", "error");
  program.exitOverride(error);
}

export { program };
