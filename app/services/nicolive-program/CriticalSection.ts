class CriticalSection {
  private prev: Promise<unknown> | undefined;
  private nest = 0;
  async guard<T>(fn: () => Promise<T>): Promise<T> {
    const prev = this.prev;
    const p = (async () => {
      this.nest++;
      if (prev) {
        // 排他制御的には前の処理は resolve でも reject でもどちらでも気にせず終わるのを待つ
        await prev.then(() => { }, () => { });
      }
      try {
        return await fn();
      } finally {
        this.nest--;
        if (this.nest === 0) {
          this.prev = undefined;
        }
      }
    })();
    this.prev = p;
    return p;
  }

  async wait() {
    if (this.prev !== undefined) {
      await this.prev;
    }
  }
}
