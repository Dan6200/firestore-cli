// import { ChalkInstance } from "chalk";
// import { DocumentSnapshot, QuerySnapshot } from "@google-cloud/firestore";
// import { printObj } from "./object.mjs";
//
// export function printDocuments(
//   snapshot: QuerySnapshot | DocumentSnapshot,
//   chalk: ChalkInstance,
//   failedToStartPager = true,
//   whiteSpace = 2,
//   stdOutput = "",
// ) {
//   const INDENT = " ".repeat(whiteSpace);
//   const NEWLINE_AMOUNT = Math.floor(Math.max(1, Math.log2(whiteSpace)));
//   let output: string;
//   if (snapshot instanceof DocumentSnapshot) {
//     if (!snapshot.exists) {
//       if (failedToStartPager) process.stdout.write("[]");
//       else return "[]";
//       return;
//     }
//     output =
//       `${snapshot.id} => ${printObj(snapshot.data(), 0, INDENT, chalk)}` +
//       "\n".repeat(NEWLINE_AMOUNT);
//     if (failedToStartPager) process.stdout.write(output);
//     else return output;
//     return;
//   }
//   if (snapshot.empty) {
//     if (failedToStartPager) {
//       process.stdout.write("[]");
//       return;
//     } else return "[]";
//   }
//   output = "[" + "\n".repeat(NEWLINE_AMOUNT);
//   if (failedToStartPager) process.stdout.write(output);
//   else stdOutput += output;
//   let docCount = 1;
//   snapshot.forEach((doc) => {
//     if (docCount !== snapshot.size) {
//       output =
//         `${INDENT + doc.id} => ${printObj(
//           doc.data(),
//           undefined,
//           INDENT,
//           chalk,
//         )},` + "\n".repeat(NEWLINE_AMOUNT);
//     } else {
//       output =
//         `${INDENT + doc.id} => ${printObj(
//           doc.data(),
//           undefined,
//           INDENT,
//           chalk,
//         )}` + "\n".repeat(NEWLINE_AMOUNT);
//     }
//     if (!output) throw new Error("Error fetching documents!");
//     if (failedToStartPager) process.stdout.write(output);
//     else stdOutput += output;
//     docCount++;
//   });
//   output = "]";
//   if (failedToStartPager) process.stdout.write(output);
//   else stdOutput += output;
//   return stdOutput;
// }
