import { DocumentSnapshot, QuerySnapshot } from "@google-cloud/firestore";
import { Options } from "commander";

export function printJSON(
  snapshot: DocumentSnapshot | QuerySnapshot,
  options: Options,
) {
  const snapArray: any[] = [];
  if (snapshot instanceof QuerySnapshot) {
    snapshot.forEach((doc) => snapArray.push({ id: doc.id, data: doc.data() }));
    return JSON.stringify(snapArray, null, options.whiteSpace ?? 2);
  }
}
