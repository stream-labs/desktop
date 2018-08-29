
export enum EApiPermissions {
  Example = 'slobs.example',
  Sources = 'slobs.sources'
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

}
