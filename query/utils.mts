import { CollectionReference, Filter, Query } from "@google-cloud/firestore";
import { Condition, WhereClause, WhereCondition } from "commander";

export default function handleWhereClause(
  ref: CollectionReference | Query,
  where: Condition,
) {
  if (!where || !where.length)
    throw new Error("Must contain where clause if the --where flag is used");
  const result = evalCondition(ref, where);
  if (!(result instanceof Query))
    throw new Error("Final result must be a Query Object");
  ref = result;
  return ref;
}

function evalCondition(ref: Query, conList: Condition): WhereClause | Query {
  const conOp: ["or", "and"] = ["or", "and"];
  if (checkConOp(conList, conOp[0])) {
    const opIdx = conList.indexOf(conOp[0]);
    const con = conList.slice(0, opIdx);
    if (!isWhereClause(con))
      throw new Error("Invalid where clause: " + JSON.stringify(con));
    const cond1 = con;
    const rest = conList.slice(opIdx + 1, conList.length) as Condition;
    let cond2, cond;
    if (checkConOp(rest, conOp[0])) cond = evalCondition(ref, rest);
    else if (checkConOp(rest, conOp[1]))
      cond = evalCondition(ref, rest) as WhereClause;
    else cond = rest;
    if (cond instanceof Query) return cond;
    if (!isWhereClause(cond)) {
      throw new Error("Invalid where clause: " + JSON.stringify(cond));
    }
    cond2 = cond;
    return evaluate(ref, cond1, conOp[0].toLowerCase() as "and" | "or", cond2);
  }

  if (checkConOp(conList, conOp[1])) {
    const opIdx = conList.indexOf(conOp[1]);
    const con = conList.slice(0, opIdx);
    if (!isWhereClause(con))
      throw new Error("Invalid where clause: " + JSON.stringify(con));
    const cond1 = con;
    const rest = conList.slice(opIdx + 1, conList.length) as Condition;

    let cond2, cond;
    if (checkConOp(rest, conOp[0])) cond = evalCondition(ref, rest);
    else if (checkConOp(rest, conOp[1]))
      cond = evalCondition(ref, rest) as WhereClause;
    else cond = rest;
    if (!isWhereClause(cond)) {
      throw new Error("Invalid where clause: " + JSON.stringify(cond));
    }
    cond2 = cond;
    return evaluate(ref, cond1, conOp[1].toLowerCase() as "and" | "or", cond2);
  }
  if (!isWhereClause(conList))
    throw new Error("Invalid where clause: " + JSON.stringify(conList));
  return ref.where(conList[0], conList[1], conList[2]);
}

function evaluate(
  ref: Query,
  cond1: WhereClause,
  Op: "and" | "or",
  cond2: WhereClause,
) {
  Op = Op.toLowerCase() as "and" | "or";
  if (Op !== "and" && Op !== "or")
    throw new Error("Must be an 'AND' or 'OR' statement");
  return ref.where(
    Filter[Op](
      Filter.where(cond1[0], cond1[1], cond1[2]),
      Filter.where(cond2[0], cond2[1], cond2[2]),
    ),
  );
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

function isValidWhereCondition(condition: any): condition is WhereCondition {
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
  isValidWhereCondition(clause[1]);

const checkConOp = (conList: Condition, conOp: "and" | "or") =>
  conList.includes(conOp.toLowerCase()) ||
  conList.includes(conOp.toUpperCase());
