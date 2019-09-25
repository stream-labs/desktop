import { TVoidFunctions, IActionsReturn } from '.';

/**
 * Classes that subclass ServiceHelper save constructor's
 * arguments to send them with each called function.
 * We need to save constructor arguments to create the same
 * class instance in another window.
 * Caveats:
 * - constructor arguments must be able to be serialized
 * - constructor must not have side effects
 */
export abstract class ServiceHelper {
  _constructorArgs: any[];
  _resourceId: string;

  constructor(...args: any[]) {
    this._constructorArgs = args;
    this._resourceId = this.constructor.name + JSON.stringify(args);
  }

  /**
   * Actions are a restricted way to call methods on a service helper.
   * It is an async representation of the service helper that discards
   * return values by default.
   */
  get actions(): TVoidFunctions<this> & IActionsReturn<this> {
    // The internal API client handles this via Proxies at runtime.
    // This getter is here for the type system only.
    // Attempting to call actions from the worker window will result
    // in a poor experience.

    // TODO: Make a dummy synchronous aciton handler here
    return null;
  }
}
