/**
 * simple singleton service implementation
 * @see original code http://stackoverflow.com/a/26227662
 */
import { Subject } from 'rxjs';

const singleton = Symbol();
const singletonEnforcer = Symbol();
const instances: Service[] = [];

/**
 * Makes all functions return a Promise and sets other types to never
 */
type TPromisifyFunctions<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any ? TPromisifyFunction<T[P]> : never
};

/**
 * Wraps the return type in a promise if it doesn't already return a promise
 */
type TPromisifyFunction<T> = T extends (...args: infer P) => infer R
  ? T extends (...args: any) => Promise<any>
    ? (...args: P) => R
    : (...args: P) => Promise<R>
  : T;

/**
 * Makes all functions return void and sets other types to never
 */
export type TVoidFunctions<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any ? TVoidFunction<T[P]> : never
};

/**
 * Takes a function and makes its return type void
 */
type TVoidFunction<T> = T extends (...args: infer P) => any ? (...args: P) => void : T;

export interface IActionsReturn<T> {
  return: TPromisifyFunctions<T>;
}

export abstract class Service {
  static isSingleton = true;

  /**
   * lifecycle hook
   */
  static serviceAfterInit = new Subject<Service>();

  private static proxyFn: (service: Service) => Service;

  /**
   * custom init function
   */
  private static initFn: (service: Service) => void;

  serviceName = this.constructor.name;

  static get instance() {
    const instance = !this.hasInstance ? Service.createInstance(this) : this[singleton];
    return this.proxyFn ? this.proxyFn(instance) : instance;
  }

  static get hasInstance(): boolean {
    return !!instances[this.name];
  }

  /**
   * proxy function will be applied for all services instances
   */
  static setupProxy(fn: (service: Service) => Service) {
    this.proxyFn = fn;
  }

  /**
   * replace init function
   */
  static setupInitFunction(fn: (service: Service) => boolean) {
    this.initFn = fn;
  }

  /**
   * all services must be created via factory method
   */
  static createInstance(ServiceClass: any) {
    if (ServiceClass.hasInstance) {
      throw 'Unable to create more than one singleton service';
    }
    ServiceClass.isSingleton = true;
    const instance = new ServiceClass(singletonEnforcer);
    ServiceClass[singleton] = instance;
    instances[ServiceClass.name] = instance;

    const mustInit = !this.initFn;

    // call a custom init function if exists
    if (this.initFn) this.initFn(instance);

    if (mustInit) instance.init();

    instance.mounted();
    Service.serviceAfterInit.next(instance);
    if (mustInit) instance.afterInit();
    return instance;
  }

  static getResourceId(resource: any): string {
    const resourceId = resource.resourceId || resource.serviceName;
    if (!resourceId) throw new Error('invalid resource');
    return resourceId;
  }

  constructor(enforcer: Symbol) {
    if (enforcer !== singletonEnforcer) throw 'Cannot construct singleton';
  }

  /**
   * calls only once per application life
   */
  protected init() {}

  /**
   * calls only once per window life
   */
  protected mounted() {}

  /**
   * calls only once per application life
   * all observers are ready to listen service's events
   */
  protected afterInit() {}

  /**
   * Actions are a restricted way to call methods on a service.
   * It is an async representation of the service that discards
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
