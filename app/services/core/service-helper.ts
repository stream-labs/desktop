/**
 * Classes with ServiceHelper decorator saves constructor's
 * arguments to send them with each called mutation.
 * We need to save constructor arguments to create the same
 * class instance in another window.
 * Caveats:
 * - constructor arguments must be able to be serialized
 * - constructor must not have side effects
 */
import { inheritMutations } from './stateful-service';

// tslint:disable-next-line:function-name
export function ServiceHelper(): ClassDecorator {
  return function(target: any) {
    const original = target;

    // create new constructor that will save arguments in instance
    const f: any = function(this: any, ...args: any[]) {
      original.apply(this, args);
      this.constructorArgs = args;
      this.isHelper = true;
      this.helperName = target.name;
      this._resourceId = this.helperName + JSON.stringify(this.constructorArgs);
      return this;
    };

    // copy prototype so intanceof operator still works
    f.prototype = original.prototype;

    // vuex modules names related to constructor name
    // so we need to save the name
    Object.defineProperty(f, 'name', { value: target.name });

    inheritMutations(f);

    // return new constructor (will override original)
    return f;
  };
}
