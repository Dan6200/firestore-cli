import {
  CollectionReference,
  DocumentReference,
  WriteResult,
} from "@google-cloud/firestore";
import { BlockingQueue } from "../../utils/algorithms/blocking-queues.js";
import pLimit from "p-limit";
import { isCollection } from "../../utils/firestore-utils.mjs";
import { discoverPaths } from "./path-discoverer.mjs";
import { CLI_LOG } from "../logging.mjs";

export async function processQueue(
  queue: BlockingQueue<CollectionReference | DocumentReference>,
  recursive: boolean,
  callback: (
    ref: DocumentReference,
    signal?: AbortSignal,
  ) => Promise<WriteResult>,
  timeout = 30_000,
) {
  const limit = pLimit(20);
  const activeTasks = new Set<Promise<void>>();

  try {
    while (true) {
      const ref = await queue.dequeue();

      if (activeTasks.size >= 100) {
        await Promise.race(activeTasks);
      }

      const controller = new AbortController();
      const { signal } = controller;
      let timer: NodeJS.Timeout = null;
      const task = limit(async () => {
        timer = setTimeout(() => controller.abort(), timeout);
        if (isCollection(ref)) {
          if (recursive) {
            await discoverPaths(queue, ref, signal);
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
          await callback(ref, signal);
        }
      })
        .catch((error) => {
          if (signal.aborted) {
            CLI_LOG(`Task timed out for: ${ref.path}`, "error");
          } else {
            throw error;
          }
        })
        .finally(() => {
          clearTimeout(timer);
          activeTasks.delete(task);

          if (queue.size === 0 && activeTasks.size === 0) {
            queue.close();
          }
        });

      activeTasks.add(task);
    }
  } catch (err: any) {
    if (err.message !== "Queue closed: Consumer cancelled") throw err;
  }
}
