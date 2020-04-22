/**
 * Classes with ServiceHelper decorator saves constructor's
 * arguments to send them with each called mutation.
 * We need to save constructor arguments to create the same
 * class instance in another window.
 *
 * Each ServiceHelper should have isDestroyed() method
 * that allows to detect calls from deleted helpers
 *
 * Caveats:
 * - constructor arguments must be able to be serialized
 * - constructor must not have side effects
 */
import { inheritMutations } from './stateful-service';
import Utils from 'services/utils';

export function ServiceHelper(): ClassDecorator {
  return function(target: any) {
    const original = target;
    const name = target.name;

    // create new constructor that will save arguments in instance
    const f: any = function(this: any, ...args: any[]) {
      original.apply(this, args);
      this._isHelper = true;
      this._constructorArgs = args;
      this._resourceId = target.name + JSON.stringify(args);

      // check if object has been destroyed before each API call
      if (!this.isDestroyed) {
        throw new Error(`isDestroyed() method should be defined for "${name}"`);
      }
      return new Proxy(this, {
        get: (target, key: string) => {
          if (typeof target[key] === 'function' && target.isDestroyed()) {
            throw new Error(
              `Trying to call the method "${key}" on destroyed object "${this._resourceId}"`,
            );
          }
          return target[key];
        },
      });
    };

    // copy prototype so intanceof operator still works
    f.prototype = original.prototype;

    // vuex modules names related to constructor name
    // so we need to save the name
    Object.defineProperty(f, 'name', { value: name });

    inheritMutations(f);

    // return new constructor (will override original)
    return f;
  };
}

export function ExecuteInWorkerProcess(): MethodDecorator {
  return function(target: any, property: string, descriptor: PropertyDescriptor) {
    return Object.assign({}, descriptor, {
      value(...args: any[]) {
        if (Utils.isWorkerWindow()) {
          return descriptor.value.apply(this, args);
        }

        // TODO: Find something better than global var
        return window['servicesManager'].internalApiClient.getRequestHandler(this, property, {
          isAction: false,
          shouldReturn: true,
        })(...args);
      },
    });
  };
}
