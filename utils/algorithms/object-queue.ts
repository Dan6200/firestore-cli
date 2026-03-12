export class ObjectQueue<T> {
  private items: { [index: string]: T };
  private head: number;
  private tail: number;

  constructor(items: T[] = [], head = 0, tail = 0) {
    this.items = {};
    this.head = head;
    this.tail = tail;
    if (items.length > 0) {
      for (const item of items) {
        this.enqueue(item);
      }
    }
  }

  enqueue(item: T) {
    this.items[this.tail++] = item;
  }

  dequeue(): T {
    if (this.head === this.tail) throw new Error("List is empty.");

    const item = this.items[this.head];
    delete this.items[this.head++];
    return item;
  }

  get length(): number {
    return this.tail - this.head;
  }
}
