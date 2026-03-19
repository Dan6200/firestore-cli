import { CollectionReference, Filter, Query } from "@google-cloud/firestore";
import { Condition, WhereClause } from "commander";

export default function handleWhereClause(
  ref: CollectionReference | Query,
  where: Condition | WhereClause,
) {
  if (!where || (Array.isArray(where) && where.length === 0)) return ref;

  // If it's a single [field, op, value] clause, apply it directly
  if (isWhereClause(where)) {
    return ref.where(where[0], where[1], where[2]);
  }

  // Otherwise, parse it into a complex Filter
  const finalFilter = parseCondition(where as Condition);
  return ref.where(finalFilter);
}

function parseCondition(conList: Condition): any {
  // 1. Determine the operator.
  // If 'or' exists in the array, we treat the whole group as an OR.
  // Otherwise, it defaults to AND (supporting your implicit request).
  const hasOr = conList.some(
    (item) => typeof item === "string" && item.toLowerCase() === "or",
  );
  const op = hasOr ? "or" : "and";

  // 2. Filter out the operator strings and parse the remaining parts
  const parts = conList
    .filter(
      (item) =>
        typeof item !== "string" ||
        (item.toLowerCase() !== "and" && item.toLowerCase() !== "or"),
    )
    .map((item) => {
      if (isWhereClause(item)) {
        return Filter.where(item[0], item[1], item[2]);
      }
      if (Array.isArray(item)) {
        return parseCondition(item as Condition);
      }
      throw new Error("Invalid condition structure");
    });

  // 3. Return the combined filter
  return Filter[op](...parts);
}

function isWhereClause(clause: any): clause is WhereClause {
  return (
    Array.isArray(clause) &&
    clause.length === 3 &&
    typeof clause[0] === "string" &&
    isValidWhereCondition(clause[1])
  );
}

function isValidWhereCondition(op: string): boolean {
  return [
    "==",
    ">",
    ">=",
    "<=",
    "<",
    "!=",
    "in",
    "not-in",
    "array-contains",
    "array-contains-any",
  ].includes(op);
}
