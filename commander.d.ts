import { FieldPath } from "@google-cloud/firestore";
import { Command } from "commander";

declare module "commander" {
  interface Options {
    end: any;
    start: any;
    debug?: boolean;
    serviceAccountKey?: string;
    databaseId?: string;
    where?: Condition;
    json?: boolean;
    whiteSpace?: number;
    bulk?: boolean;
    file?: string;
    fileType?: "JSON" | "CSV" | "YAML";
    noPager?: boolean;
    pager?: string | boolean;
    pagerArgs?: string[];
    merge?: boolean;
    projectId?: string;
    stream?: boolean;
    rateLimit?: number;
    jsonl?: boolean;
    recurse?: boolean;
    asc?: string[];
    desc?: string[];
    startAfter?: number[];
    startAt?: number[];
    endAt?: number[];
    startBefore?: number[];
    endBefore?: number[];
    limit?: number;
  }
  type WhereClause = [string, WhereOperator, any];
  type OrClause = ["or" | "OR", ...WhereClause];
  type WhereOperator =
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
