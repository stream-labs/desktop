import { WaitNotify } from "./WaitNotify";

export type StartFunc = () => Promise<{
  cancel: () => Promise<void>;
  running: Promise<void>;
} | null>;

export class QueueRunner {
  private queue: {
    start: StartFunc;
    label: string;
  }[] = [];
  private runningState: {
    cancel: () => Promise<void>;
    running: Promise<void>;
    state: 'preparing' | 'running';
  } | null = null;

  runNext() {
    setTimeout(() => this._run(), 0);
  }
  private nextNotifier = new WaitNotify();
  private debug: boolean;

  constructor(options: {
    debug?: boolean;
  } = {}) {
    this.debug = options.debug || false;
  }

  private async _run() {
    if (this.runningState) {
      return;
    }
    const next = this.queue.shift();
    if (next) {
      const { start, label } = next;
      if (start) {
        let earlyCancel = false;
        let resolveRunning2: () => void = () => { };
        const running2 = new Promise<void>((resolve) => { resolveRunning2 = resolve; });
        running2.then(() => {
          if (this.debug) {
            console.log(`QueueRunner: finished ${label}`);
          }
          this.runningState = null;
          this.runNext();
        });
        this.runningState = {
          cancel: async () => {
            this.runningState.cancel = async () => { await running2; };
            earlyCancel = true;
            await running2;
          },
          running: running2,
          state: 'preparing',
        };
        if (this.debug) {
          console.log(`QueueRunner: preparing ${label}`);
        }
        start().then((r) => {
          if (!r) {
            if (this.debug) {
              console.log(`QueueRunner: not started ${label}`);
            }
            resolveRunning2();
          } else {
            const { cancel, running: speaking } = r;
            if (earlyCancel) {
              if (this.debug) {
                console.log(`QueueRunner: early cancel ${label}`);
              }
              cancel().then(() => {
                resolveRunning2();
              });
            } else {
              if (this.debug) {
                console.log(`QueueRunner: running ${label}`);
              }
              this.runningState = {
                cancel: async () => {
                  this.runningState.cancel = async () => { await running2; };
                  await cancel();
                  await running2;
                },
                running: speaking.then(() => {
                  resolveRunning2();
                }),
                state: 'running',
              };
            }
          }
        });
      }
    } else {
      this.nextNotifier.notify();
    }
  }
  async cancel() {
    // 実行中のものはキャンセルし、キューに残っているものは削除する
    this.queue = [];
    if (this.runningState) {
      await this.runningState.cancel();
    }
  }

  get isRunning(): boolean {
    return this.runningState !== null || this.queue.length > 0;
  }

  async waitUntilFinished(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    return this.nextNotifier.wait();
  }

  /**
   * 
   * @param start 準備を開始する関数。準備が完了したら、キャンセル関数と実行中のPromiseをobjectで返す。実行を開始しなかったらnullを返す。
   * @param label デバッグ表示用のラベル
   */
  add(start: StartFunc, label: string) {
    this.queue.push({ start, label });
  }

  get state(): 'preparing' | 'running' | null {
    return this.runningState ? this.runningState.state : null;
  }

  get length(): number {
    return this.queue.length;
  }
}
