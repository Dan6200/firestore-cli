import { DocumentSnapshot, QuerySnapshot } from "@google-cloud/firestore";
import { Chalk } from "chalk";
import { Options } from "commander";
import { printDocuments } from "./documents.mjs";
const chalk = new Chalk({ level: 3 });

export const printSnapshot = async (
  snapshot: DocumentSnapshot | QuerySnapshot,
  { json, whiteSpace }: Options,
  failedToStartPager = false,
  stdOutput = "",
) => {
  let printableSnapshot: any;
  // Handle json print option...
  if (json) {
    // Handle different types of snapshots...
    // ...Make printing JSONs its own function/method
    if (snapshot instanceof DocumentSnapshot) {
      if (!snapshot.exists) throw new Error("Document does not exist");
      printableSnapshot = {
        id: snapshot.id,
        createTime: snapshot.createTime.seconds,
        data: snapshot.data(),
      };
    } else {
      if (snapshot.empty) throw new Error("Query returned no documents");
      printableSnapshot = [];
      snapshot.forEach((doc) =>
        printableSnapshot.push({ [doc.id]: doc.data() }),
      );
    }
    stdOutput = JSON.stringify(printableSnapshot, null, whiteSpace ?? 2);
    if (failedToStartPager) process.stdout.write(stdOutput);
  } else {
    // Regular printing...
    stdOutput += printDocuments(
      snapshot,
      chalk,
      failedToStartPager,
      whiteSpace,
    );
  }
  return stdOutput;
};
