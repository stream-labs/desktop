/**
 * simple singleton service implementation
 * @see original code http://stackoverflow.com/a/26227662
 */

const singleton = Symbol();
const singletonEnforcer = Symbol();

/**
 * @abstract
 */
export default class Service {

  static instancesContainer = {};

  constructor(enforcer) {
    if(enforcer != singletonEnforcer) throw "Cannot construct singleton";
  }

  static get instance() {
    if(!this[singleton]) {
      let instance = new this(singletonEnforcer);
      Service.instancesContainer[instance.constructor.name] = instance;
      return this[singleton] = instance;
    }
    return this[singleton];
  }
}