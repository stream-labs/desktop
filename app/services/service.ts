/**
 * simple singleton service implementation
 * @see original code http://stackoverflow.com/a/26227662
 */
import electron from '../vendor/electron';

const singleton = Symbol();
const singletonEnforcer = Symbol();

/**
 * Service with InitAfter decorator will be created after the observable
 * service initialization. This allows observable service to know nothing about observer.
 * In this case observer-service is like a "plugin" for observable service.
 */
export function InitAfter(...observableServices: typeof Service[]): ClassDecorator {
  return function (target: typeof Service) {
    Service.observeList.push({ ObserverService: target, observableServices });
  };
}

/**
 * DI decorator
 * @see http://source.coveo.com/2016/02/04/typescript-injection-decorator/
 */
export function Inject() {
  return function (target: Object, key: string) {
    const ServiceClass = Reflect.getMetadata('design:type', target, key);
    Object.defineProperty(target, key, {
      get() { return ServiceClass.instance; }
    });
  };
}

export abstract class Service {

  static observeList: {
    ObserverService: typeof Service,
    observableServices: typeof Service[]
  }[] = [];

  static hasInstance = false;

  serviceName = this.constructor.name;
  options = {};

  static get instance() {
    if (!this.hasInstance) return Service.createInstance(this);
    return this[singleton];
  }


  /**
   * all services must be created via factory method
   */
  static createInstance(ServiceClass: any, options?: Dictionary<any>) {
    if (ServiceClass.hasInstance) {
      throw `Unable to create more than one singleton service`;
    }
    ServiceClass.hasInstance = true;
    const instance = new ServiceClass(singletonEnforcer, options);
    ServiceClass[singleton] = instance;

    const shouldInit = electron.ipcRenderer.sendSync('services-shouldInit', ServiceClass.name);
    if (shouldInit) instance.init();
    instance.mounted();
    Service.initObservers(ServiceClass.name);

    return instance;
  }


  static initObservers(observableServiceName: string): Service[] {
    const observers = this.observeList.filter(item => {
      return item.observableServices.find(service => service.name === observableServiceName);
    });
    return observers.map(observer => observer.ObserverService.instance);
  }


  constructor(enforcer: Symbol, options: Dictionary<any>) {
    if (enforcer !== singletonEnforcer) throw 'Cannot construct singleton';
    this.options = options || this.options;
  }


  /**
   * calls only once per application life
   */
  protected init() {
  }


  /**
   * calls only once per window life
   */
  protected mounted() {
  }

}
