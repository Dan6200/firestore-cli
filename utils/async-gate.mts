import { BlockingQueue } from "./algorithms/blocking-queues.js";

type CallbackFn = (...args: any[]) => any;

export class AsyncGate {
  private queue: BlockingQueue<{
    resolve: (value: unknown) => void;
    reject: (reason: Error) => void;
    callback: CallbackFn;
  }>;
  private MAX_WORKERS: number;
  private activeTasks: number;

  constructor(MAX_WORKERS: number) {
    this.queue = new BlockingQueue<{
      resolve: (value: unknown) => void;
      reject: (reason: Error) => void;
      callback: CallbackFn;
    }>({ maxSize: MAX_WORKERS });
    this.MAX_WORKERS = MAX_WORKERS;
    this.activeTasks = 0;
  }

  async run(callback: CallbackFn) {
    return new Promise((resolve, reject) => {
      this.queue.enqueue({ resolve, reject, callback });
      this.next();
    });
  }

  async next() {
    if (this.activeTasks >= this.MAX_WORKERS || !this.queue.size) return;
    this.activeTasks++;
    const { resolve, reject, callback } = await this.queue.dequeue();
    try {
      const result = await callback();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this.activeTasks--;
      this.next();
    }
  }
}
