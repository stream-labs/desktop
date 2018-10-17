export function sleep (timeout: number) {
  return new Promise(done => setTimeout(done, timeout));
}
