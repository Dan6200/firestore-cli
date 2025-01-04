import { Command } from "commander";

declare module "commander" {
  interface Options {
    serviceAccount: string;
    databaseId?: string;
    where?: Condition;
    json?: boolean;
    whiteSpace?: number;
    bulk?: boolean;
    file?: string;
    fileType?: "JSON" | "CSV" | "YAML";
  }
  type WhereClause = [string, WhereCondition, any];
  type OrClause = ["or" | "OR", ...WhereClause];
  type WhereCondition =
    | "=="
    | ">"
    | ">="
    | "<="
    | "<"
    | "!="
    | "in"
    | "not-in"
    | "array-contains"
    | "array-contains-any";
  type Condition = [...(WhereClause | OrClause), ...(WhereClause | OrClause)[]];
}
