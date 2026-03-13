/////////////////////////////////////////////
///// To Be Used As A Drop-in Class   ///////
/////////////////////////////////////////////
import { ObjectQueue } from "./object-queue";

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
  private closed = false;
  private maxSize: number;
  private drainResolver: () => void;
  private isDraining = false;
  private readonly maxPendingDequeues = 10_000;

  constructor(items: T[] = [], maxSize = 1000) {
    this.items = new ObjectQueue<T>(items);
    this.maxSize = maxSize;
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
    if (this.closed) return Promise.reject("Queue is closed");

    if (this.dequeueResolvers.length > 0) {
      const { resolve } = this.dequeueResolvers.dequeue()!;
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
      const returnItem = Promise.resolve(this.items.dequeue()!);
      const { resolve } = this.enqueueResolvers.dequeue()!;
      resolve();
      return returnItem;
    }

    if (this.isDraining && this.drainResolver) {
      this.drainResolver();
      this.drainResolver = null;
    }

    if (this.closed) return Promise.reject(new Error("Queue is closed"));
    if (this.dequeueResolvers.length === this.maxPendingDequeues)
      return Promise.reject(new Error("Maximum consumer limit exceeded."));

    return new Promise((resolve, reject) => {
      // Block or Defer the dequeue action...
      this.dequeueResolvers.enqueue({ resolve, reject });
    });
  }

  close() {
    this.closed = true;
    while (this.enqueueResolvers.length > 0) {
      const { reject } = this.enqueueResolvers.dequeue()!;
      reject(new Error("Queue closed: Consumer cancelled"));
    }
    while (this.dequeueResolvers.length > 0) {
      const { reject } = this.dequeueResolvers.dequeue()!;
      reject(new Error("Queue closed: Consumer cancelled"));
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
