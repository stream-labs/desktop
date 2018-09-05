export enum EApiPermissions {
  Example = 'slobs.example',
  ScenesSources = 'slobs.scenes-sources',
  ObsSettings = 'slobs.obs-settings'
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

export class NotImplementedError extends Error {
  constructor() {
    super(
      'This function is not yet implemented.  It you are interested in ' +
      'using it, please reach out to the Streamlabs dev team.  Thanks!'
    );
  }
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
   * Takes a patch object and validates it against the required keys.
   * @param requiredKeys keys required in the original object
   */
  validatePatch(requiredKeys: string[], patch: Dictionary<any>) {
    requiredKeys.forEach(key => {
      if (!patch[key]) {
        throw new Error(`Missing required key in patch: ${key}`);
      }
    });
  }

}
