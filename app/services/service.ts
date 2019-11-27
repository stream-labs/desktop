/**
 * simple singleton service implementation
 * @see original code http://stackoverflow.com/a/26227662
 */
import { Subject } from 'rxjs';

const singleton = Symbol();
const singletonEnforcer = Symbol();
const instances: Service[] = [];

export abstract class Service {
  static isSingleton = true;

  /**
   * lifecycle hook
   */
  static serviceAfterInit = new Subject<Service>();

  private static proxyFn: (service: Service) => Service;

  /**
   * returns true if service has been successfully initialized
   */
  private static initFn: (service: Service) => boolean;

  serviceName = this.constructor.name;

  static get instance() {
    const instance = !this.hasInstance
      ? Service.createInstance(this)
      : this[singleton];
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

    const mustInit = this.initFn ? !this.initFn(instance) : true;

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
}
