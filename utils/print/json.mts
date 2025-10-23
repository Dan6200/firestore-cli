import { DocumentSnapshot, QuerySnapshot } from "@google-cloud/firestore";
import { Options } from "commander";

export function printJSON(
  snapshot: DocumentSnapshot | QuerySnapshot | DocumentSnapshot[],
  options: Options,
) {
  const snapArray: any[] = [];
  if (
    snapshot instanceof QuerySnapshot ||
    (Array.isArray(snapshot) && snapshot instanceof DocumentSnapshot)
  ) {
    snapshot.forEach((doc) => snapArray.push({ id: doc.id, data: doc.data() }));
    return JSON.stringify(snapArray, null, options.whiteSpace ?? 2);
  }
  if (snapshot instanceof DocumentSnapshot)
    return JSON.stringify(
      { id: snapshot.id, data: snapshot.data() },
      null,
      options.whiteSpace ?? 2,
    );
  throw new Error(
    "Snapshot must be an instance of QuerySnapshot or DocumentSnapshot",
  );
}
