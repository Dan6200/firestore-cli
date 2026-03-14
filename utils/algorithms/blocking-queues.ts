/////////////////////////////////////////////
///// To Be Used As A Drop-in Class   ///////
/////////////////////////////////////////////
import { ObjectQueue } from "./object-queue";

interface QueueOptions<T> {
  initialItems?: T[];
  maxSize?: number;
  maxPendingDequeues?: number;
}

export class BlockingQueue<T> {
  private items: ObjectQueue<T>;
  private enqueueResolvers: ObjectQueue<{
    resolve: () => void;
    reject: (reason: any) => void;
  }>;
  private dequeueResolvers: ObjectQueue<{
    resolve: (value: T) => void;
    reject: (reason: any) => void;
  }>;
  private isClosed = false;
  private maxSize: number;
  private drainResolver: () => void;
  private isDraining = false;
  private readonly maxPendingDequeues = 10_000;

  constructor(options: QueueOptions<T> = {}) {
    this.items = new ObjectQueue<T>(options.initialItems ?? []);
    this.maxSize = options.maxSize ?? 1000;
    this.enqueueResolvers = new ObjectQueue<{
      resolve: () => void;
      reject: (reason: any) => void;
    }>();
    this.dequeueResolvers = new ObjectQueue<{
      resolve: (value: T) => void;
      reject: (reason: any) => void;
    }>();
  }

  async enqueue(item: T): Promise<void> {
    if (this.isClosed) return Promise.reject("Queue is closed.");
    if (this.isDraining) return Promise.reject("Queue is draining.");

    if (this.dequeueResolvers.length > 0) {
      let resolve;
      try {
        ({ resolve } = this.dequeueResolvers.dequeue()!);
      } catch (e) {
        throw new Error(`BlockingQueue internal failure: enqueueResolvers.`, {
          cause: e,
        });
      }
      resolve(item);
      return;
    }
    if (this.items.length >= this.maxSize) {
      // Block the enqueue action...
      await new Promise<void>((resolve, reject) => {
        this.enqueueResolvers.enqueue({ resolve, reject });
      });
    }
    this.items.enqueue(item);
  }

  dequeue(): Promise<T> {
    if (this.size > 0) {
      const returnItem = Promise.resolve(this.items.dequeue()!).catch((e) => {
        throw new Error(
          `BlockingQueue internal failure: items queue exhausted.`,
          { cause: e },
        );
      });
      if (this.enqueueResolvers.length > 0) {
        let resolve;
        try {
          ({ resolve } = this.enqueueResolvers.dequeue()!);
        } catch (e) {
          throw new Error(`BlockingQueue internal failure: enqueueResolvers.`, {
            cause: e,
          });
        }
        resolve();
      }

      if (this.size == 0 && this.isDraining && this.drainResolver) {
        this.drainResolver();
        this.drainResolver = null;
      }
      return returnItem;
    }

    if (this.isClosed) return Promise.reject(new Error("Queue is closed"));
    if (this.dequeueResolvers.length === this.maxPendingDequeues)
      return Promise.reject(new Error("Maximum consumer limit exceeded."));

    return new Promise((resolve, reject) => {
      // Block or Defer the dequeue action...
      this.dequeueResolvers.enqueue({ resolve, reject });
    });
  }

  close() {
    this.isClosed = true;
    while (this.enqueueResolvers.length > 0) {
      const { reject } = this.enqueueResolvers.dequeue()!;
      reject(new Error("Queue closed: Task cancelled."));
    }
    while (this.dequeueResolvers.length > 0) {
      const { reject } = this.dequeueResolvers.dequeue()!;
      reject(new Error("Queue closed: Consumer cancelled."));
    }
  }

  drain(): Promise<void> {
    if (this.size === 0) return Promise.resolve();
    return new Promise((resolve) => {
      this.isDraining = true;
      this.drainResolver = resolve;
    });
  }

  get size() {
    return this.items.length;
  }

  get waitingConsumers() {
    return this.dequeueResolvers.length;
  }

  get waitingProducers() {
    return this.enqueueResolvers.length;
  }

  getStatus() {
    let msg = "";
    if (this.size === 0) return "System standby.";
    msg += `Processing ${this.size} items...`;
    if (this.waitingConsumers > 0) {
      msg += `Pending: ${this.waitingConsumers} sonsumers waiting for data...`;
    }
    if (this.waitingProducers > 0) {
      msg += `Pending" ${this.waitingProducers} producers waiting to send data...`;
    }
  }
}
