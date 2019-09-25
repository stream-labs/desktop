/**
 * Classes with ServiceHelper decorator saves constructor's
 * arguments to send them with each called function.
 * We need to save constructor arguments to create the same
 * class instance in another window.
 * Caveats:
 * - constructor arguments must be able to be serialized
 * - constructor must not have side effects
 */
import { inheritMutations } from './stateful-service';
import { TVoidFunctions, IActionsReturn } from '.';

// export function ServiceHelper(): ClassDecorator {
//   return function(target: any) {
//     const original = target;

//     // create new constructor that will save arguments in instance
//     const f: any = function(this: any, ...args: any[]) {
//       original.apply(this, args);
//       this._isHelper = true;
//       this._constructorArgs = args;
//       this._resourceId = target.name + JSON.stringify(args);
//       return this;
//     };

//     // copy prototype so intanceof operator still works
//     f.prototype = original.prototype;

//     // vuex modules names related to constructor name
//     // so we need to save the name
//     Object.defineProperty(f, 'name', { value: target.name });

//     inheritMutations(f);

//     // return new constructor (will override original)
//     return f;
//   };
// }

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
