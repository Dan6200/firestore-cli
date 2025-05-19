import { Command } from "commander";

declare module "commander" {
  interface Options {
    global?: boolean;
    credentials?: string;
    serviceAccount?: string;
    userService?: boolean;
    databaseId?: string;
    parentType?: "folder" | "organization";
    parentId?: string;
    where?: Condition;
    json?: boolean;
    whiteSpace?: number;
    bulk?: boolean;
    file?: string;
    fileType?: "JSON" | "CSV" | "YAML";
    customId?: string;
    customIds?: string[];
    overwrite?: boolean;
    overwriteKey?: boolean;
    billingAccountId?: string;
    createProject?: boolean;
    projectName?: string;
    enableFirestore?: string;
    linkBilling?: boolean;
    locationId: string;
    pager?: string | boolean;
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
