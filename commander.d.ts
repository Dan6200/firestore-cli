import { Command } from "commander";

declare module "commander" {
  interface Command {
    printDepth?: number;
  }
}
