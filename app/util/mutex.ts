/**
 * A simple mutex that allows coordination of access
 * to a shared resource.
 */
export class Mutex {
  locked = false;
  queue: (() => void)[] = [];

  /**
   * Returns a promisee that resolves with a function that
   * should be called when access to the resource is complete.
   */
  wait(): Promise<() => void> {
    return new Promise<() => void>(resolve => {
      if (this.locked) {
        this.queue.push(() => resolve(() => this.unlock()));
      } else {
        this.locked = true;
        resolve(() => this.unlock());
      }
    });
  }

  private unlock() {
    if (!this.locked) return;

    if (this.queue.length) {
      this.queue.shift()();
    } else {
      this.locked = false;
    }
  }
}
