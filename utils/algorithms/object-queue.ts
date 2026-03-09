export class ObjectQueue<T> {
  private items: { [index: string]: T };
  private head: number;
  private tail: number;

  constructor(items = {}, head = 0, tail = 0) {
    this.items = items;
    this.head = head;
    this.tail = tail;
  }

  enqueue(item: T) {
    this.items[this.tail++] = item;
  }

  dequeue(): T {
    const item = this.items[this.head];
    delete this.items[this.head++];
    return item;
  }

  get length(): number {
    return this.tail - this.head;
  }
}
