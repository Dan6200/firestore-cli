import { Command } from "commander";

declare module "commander" {
  interface Options {
    secretKey: string;
    databaseId?: string;
    where?: [string, "==" | ">=" | "<=" | "!=", string];
  }
}
