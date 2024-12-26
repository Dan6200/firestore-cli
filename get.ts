//cspell:disable
import { Chalk } from "chalk";
import { authenticateFirestore } from "./auth-1.js";
import { printObj } from "./utils.js";

const chalk = new Chalk({ level: 3 });

export default async (collection: string) => {
  try {
    const db = await authenticateFirestore(
      "./secret-key/linkid-app-561d4-firebase-adminsdk-boiy2-a1b3f125aa.json"
    );
    const snapshot = await db.collection(collection).get();
    if (snapshot.empty) {
      console.log("[]");
      return;
    }
    const INDENT = "    ";
    console.log("[");
    let docCount = 1;
    snapshot.forEach((doc) => {
      if (docCount !== snapshot.size)
        console.log(
          `${INDENT + doc.id} => ${printObj(
            doc.data(),
            undefined,
            INDENT,
            chalk
          )},`
        );
      else
        console.log(
          `${INDENT + doc.id} => ${printObj(
            doc.data(),
            undefined,
            INDENT,
            chalk
          )}`
        );
      docCount++;
    });
    console.log("]");
  } catch (e) {
    console.error(e);
  }
};
