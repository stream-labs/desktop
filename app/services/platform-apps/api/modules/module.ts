import { pick } from 'lodash';

export enum EApiPermissions {
  Example = 'slobs.example',
  ScenesSources = 'slobs.scenes-sources'
}

type TApiHandler = (...args: any[]) => Promise<any>;
export type TApiModule = Dictionary<TApiHandler>;

export function apiMethod() {
  return (target: Module, methodName: string, descriptor: PropertyDescriptor) => {

    (target.constructor as typeof Module).apiMethods.push(methodName);
    return descriptor;
  };
}

export function apiEvent() {
  return (target: Module, methodName: string) => {

    (target.constructor as typeof Module).apiEvents.push(methodName);
  };
}

export abstract class Module {

  /**
   * The top level name of this module
   */
  abstract moduleName: string;

  /**
   * A list of permissions that this module requires
   */
  abstract permissions: EApiPermissions[];

  /**
   * Contains a list of public API methods.  Generally you should not
   * edit this directly, and instead us the @apiMethod decorator.
   */
  static apiMethods: string[] = [];

  /**
   * Contains a list of public API event observables.  Generally you should not
   * edit this directly, and instead us the @apiEvent decorator.
   */
  static apiEvents: string[] = [];

  /**
   * Takes a patch object and validates it against the required keys,
   * and then slices it down to the list of mutable keys.
   * @param requiredKeys keys required in the original object
   * @param mutableKeys keys that sohuld be left after slicing
   */
  validatePatch(requiredKeys: string[], mutableKeys: string[], patch: Dictionary<any>) {
    requiredKeys.forEach(key => {
      if (!patch[key]) {
        throw new Error(`Missing required key in patch: ${key}`);
      }
    });

    return pick(patch, mutableKeys);
  }

}
