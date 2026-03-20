import { CollectionReference, Filter, Query } from "@google-cloud/firestore";
import { Condition, WhereClause, WhereOperator } from "commander";

function isFilter(obj: any): obj is Filter {
  if (!obj || typeof obj !== "object") return false;

  const isFieldFilter = "field" in obj && "operator" in obj && "value" in obj;

  const isCompositeFilter =
    "filters" in obj && Array.isArray(obj.filters) && "operator" in obj;

  return isFieldFilter || isCompositeFilter;
}

export default function handleWhereClause(
  ref: CollectionReference | Query,
  where: Condition,
) {
  if (!where || !where.length) return ref;
  const result = evalCondition(where);
  if (!isFilter(result))
    throw new Error("Final result must be a Filter Object");
  ref = ref.where(result);
  return ref;
}

function recursiveDescHelper(conList: Condition, op: "and" | "or") {
  const opIdx = conList.indexOf(op);
  const con = conList.slice(0, opIdx);
  if (!isWhereClause(con))
    throw new Error("Invalid where clause: " + JSON.stringify(con));
  const cond1 = evalCondition(con);
  const rest = conList.slice(opIdx + 1, conList.length) as Condition;
  let cond2;
  if (checkConOp(rest, "or")) cond2 = evalCondition(rest);
  else if (checkConOp(rest, "and")) cond2 = evalCondition(rest) as WhereClause;
  else cond2 = rest;
  return evaluate(cond1, op, cond2);
}

/*
 * evalCondition(conList, conOp):
 * 	if conOp IN conList:
 * 		opIdx = findFirstIndex(conOp, conList)
 * 		cond1 = conList[:opIdx]
 * 		cond2 = conList[opIdx+1:]
 * 		if conOp IN cond2:
 * 			cond2 = evalCondition(cond2, conOp)
 * 			return;
 * 		return eval(cond1, conOp, cond2)
 * 	return conList
 */

function evalCondition(conList: Condition): WhereClause | Filter {
  const conOp: ["or", "and"] = ["or", "and"];
  if (conList.length > 3) {
    if (!conOp.includes(conList[3])) {
      conList.splice(3, 0, "and");
    }
  }
  if (checkConOp(conList, "or")) {
    return recursiveDescHelper(conList, "or");
  }

  if (checkConOp(conList, "and")) {
    return recursiveDescHelper(conList, "and");
  }

  if (!isWhereClause(conList))
    throw new Error("Invalid where clause: " + JSON.stringify(conList));
  return Filter.where(conList[0], conList[1], conList[2]);
}

function evaluate(
  cond1: WhereClause | Filter,
  Op: "and" | "or",
  cond2: WhereClause | Filter,
) {
  Op = Op.toLowerCase() as "and" | "or";
  if (Op !== "and" && Op !== "or")
    throw new Error("Must be an 'AND' or 'OR' statement");
  let expression = null;
  if (isFilter(cond1) && isFilter(cond2)) {
    expression = Filter[Op](cond1, cond2);
  } else if (isFilter(cond1) && isWhereClause(cond2)) {
    expression = Filter[Op](cond1, Filter.where(cond2[0], cond2[1], cond2[2]));
  } else if (isWhereClause(cond1) && isFilter(cond2)) {
    expression = Filter[Op](Filter.where(cond1[0], cond1[1], cond1[2]), cond2);
  } else if (isWhereClause(cond1) && isWhereClause(cond2)) {
    expression = Filter[Op](
      Filter.where(cond1[0], cond1[1], cond1[2]),
      Filter.where(cond2[0], cond2[1], cond2[2]),
    );
  } else {
    throw new Error("Invalid Where expression.");
  }
  return expression;
}

function isValidWhereOperator(condition: any): condition is WhereOperator {
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
  ].includes(condition);
}

const isWhereClause = (clause: unknown): clause is WhereClause =>
  !!clause &&
  Array.isArray(clause) &&
  typeof clause[0] === "string" &&
  clause[2] !== undefined &&
  isValidWhereOperator(clause[1]);

const checkConOp = (conList: Condition, conOp: "and" | "or") =>
  conList.includes(conOp.toLowerCase()) ||
  conList.includes(conOp.toUpperCase());
