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

  constructor(enforcer) {
    if(enforcer != singletonEnforcer) throw "Cannot construct singleton";
  }

  static get instance() {
    if(!this[singleton]) {
      this[singleton] = new this(singletonEnforcer);
    }
    return this[singleton];
  }
}