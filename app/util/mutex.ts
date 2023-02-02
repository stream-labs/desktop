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

  /**
   * Waits until the mutex is unlocked, but does not actually
   * lock it. Due to the single-threaded nature of javascript,
   * you can safely use the shared resource as long as you don't
   * do any async operations.
   */
  async synchronize() {
    const unlock = await this.wait();
    unlock();
  }

  /**
   * Pass a function to be executed when the mutex is available.
   * Using `do` ensures that if your operation raises an exception
   * or rejects, the mutex won't remain locked forever. This is the
   * preferred form as it avoids deadlocks. It also works with async
   * functions or any function that returns a promise.
   * @param fun The function to execute
   * @returns void
   */
  async do<TReturn>(fun: () => TReturn) {
    const unlock = await this.wait();

    try {
      let val = fun();

      if (val instanceof Promise) {
        val = await val;
      }

      unlock();
      return val;
    } catch (e: unknown) {
      unlock();
      throw e;
    }
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
