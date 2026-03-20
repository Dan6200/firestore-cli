import { program } from "./commands.mjs";

process.removeAllListeners("warning");
program.parse(process.argv);
