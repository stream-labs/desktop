import Utils from 'services/utils';

/**
 * Helper for registering an action that needs to be performed on window refresh
 * Does nothing in production for now
 * @returns a function to cancel the unload operation
 */
export function onUnload(fun: () => void) {
  if (!Utils.isDevMode()) return () => {};

  window.addEventListener('beforeunload', fun);

  return () => window.removeEventListener('beforeunload', fun);
}
