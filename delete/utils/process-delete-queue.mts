import {
  CollectionReference,
  DocumentReference,
  WriteResult,
} from "@google-cloud/firestore";
import { BlockingQueue } from "../../utils/algorithms/blocking-queues.js";
import pLimit from "p-limit";
import { isCollection } from "./collection-type-guard.mjs";
import { discoverPaths } from "./path-crawler.mjs";

export async function processQueue(
  queue: BlockingQueue<CollectionReference | DocumentReference>,
  recursive: boolean,
  callback: (ref: DocumentReference) => Promise<WriteResult>,
) {
  const limit = pLimit(20);
  const tasks: Promise<void>[] = [];
  let activeWork = 0;

  try {
    while (true) {
      const ref = await queue.dequeue();
      activeWork++;

      const task = limit(async () => {
        try {
          if (isCollection(ref)) {
            if (recursive) {
              await discoverPaths(queue, ref);
            } else {
              throw new Error("Collection Path provided without --recurse");
            }
          } else {
            if (recursive) {
              const subCollections = await ref.listCollections();
              for (const sub of subCollections) {
                queue.enqueue(sub);
              }
            }
            await callback(ref);
          }
        } finally {
          activeWork--;

          if (queue.size === 0 && activeWork === 0) {
            queue.close();
          }
        }
      });

      tasks.push(task);
    }
  } catch (err: any) {
    if (err.message !== "Queue closed: Consumer cancelled") throw err;
  }

  await Promise.all(tasks);
}
