// Useful for debugging.
// If you think you need to use this in an actual
// test, you almost definitely don't.

export function sleep(ms, countdown = false) {
  function countdownTick(ms) {
    if (ms < 0) return;
    console.log('sleep', ms);
    setTimeout(() => countdownTick(ms - 1000), 1000);
  }
  if (countdown) countdownTick(ms);

  return new Promise(resolve => setTimeout(resolve, ms));
}
