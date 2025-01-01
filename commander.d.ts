import { Command } from "commander";

declare module "commander" {
  interface Options {
    secretKey: string;
    databaseId?: string;
    where?: [string, "==" | ">=" | "<=" | "!=", string];
    json?: boolean;
    whiteSpace?: number;
    bulk?: boolean;
    file?: string;
    fileType?: "JSON" | "CSV" | "YAML";
  }
}
