/////////////////////////////////////////////
// To Be Used As A Drag-n-drop Library   ////
/////////////////////////////////////////////
import { ObjectQueue } from "./object-queue";

export class BlockingQueue<T> {
  private items = new ObjectQueue<T>();
  private resolvers = new ObjectQueue<{
    resolve: (value: T) => void;
    reject: (reason: any) => void;
  }>();
  private closed = false;

  enqueue(item: T) {
    if (this.closed) throw new Error("Queue is closed");

    if (this.resolvers.length > 0) {
      const { resolve } = this.resolvers.dequeue()!;
      resolve(item);
    } else {
      this.items.enqueue(item);
    }
  }

  dequeue(): Promise<T> {
    if (this.items.length > 0) {
      return Promise.resolve(this.items.dequeue()!);
    }

    if (this.closed) return Promise.reject(new Error("Queue is closed"));

    return new Promise((resolve, reject) => {
      this.resolvers.enqueue({ resolve, reject });
    });
  }

  close() {
    this.closed = true;
    while (this.resolvers.length > 0) {
      const { reject } = this.resolvers.dequeue()!;
      reject(new Error("Queue closed: Consumer cancelled"));
    }
  }

  get size() {
    return this.items.length;
  }

  get waitingConsumers() {
    return this.resolvers.length;
  }

  getStatus() {
    if (this.size > 0) {
      return `Processing ${this.size} items...`;
    } else if (this.waitingConsumers > 0) {
      return `Idle: ${this.waitingConsumers} workers waiting for data...`;
    }
    return "System standby.";
  }
}
