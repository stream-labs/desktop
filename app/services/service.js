/**
 * simple singleton service implementation
 * @see original code http://stackoverflow.com/a/26227662
 */

const singleton = Symbol();
const singletonEnforcer = Symbol();

const { ipcRenderer } = window.require('electron');


/**
 * @abstract
 */
export class Service {

  serviceName = this.constructor.name;

  static get instance() {
    if (!this[singleton]) return Service.createInstance(this);
    return this[singleton];
  }


  static createInstance(ServiceClass, options) {
    if (ServiceClass[singleton]) {
      throw `Unable to create more than one singleton service`;
    }
    ServiceClass.hasInstance = true;
    return ServiceClass[singleton] = new ServiceClass(singletonEnforcer, options);
  }


  options = {};

  constructor(enforcer, options) {
    if (enforcer != singletonEnforcer) throw "Cannot construct singleton";
    this.options = options || this.options;

    const shouldInit = ipcRenderer.sendSync('services-shouldInit', this.serviceName);

    if (shouldInit) this.init();

    this.mount();
  }


  /**
   * calls only once per application life
   */
  init() {
  }


  /**
   * calls only once per window life
   */
  mount() {
  }


}