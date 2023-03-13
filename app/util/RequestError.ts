// Sentry.captureException で内容が見えるようにするために Response ではなく Error にする
export class RequestError extends Error {
  constructor(public status: number, public url: string) {
    super(`${status}`);

    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
