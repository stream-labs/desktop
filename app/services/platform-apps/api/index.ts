import { Module, EApiPermissions, TApiModule } from './modules/module';
import { ExampleModule } from './modules/example';
import { every } from 'lodash';

export class PlatformAppsApi {

  modules: Dictionary<Module> = {};

  constructor() {
    // Register all modules
    this.registerModule(new ExampleModule());
  }

  private registerModule(module: Module) {
    this.modules[module.moduleName] = module;
  }

  /**
   * Returns an object tree of API methods.  Any modules that
   * the app does not have sufficient permission for will be
   * replaced with a method that returns a rejected promise
   * explaining the lack of permissions.
   */
  getApi(permissions: EApiPermissions[]) {
    const api: Dictionary<TApiModule> = {};

    Object.keys(this.modules).forEach(moduleName => {
      api[moduleName] = {};

      let authorized = true;

      // TODO this is a weird pattern
      for (let permission of this.modules[moduleName].permissions) {
        authorized = permissions.includes(permission);
        if (!authorized) break;
      }

      (this.modules[moduleName].constructor as typeof Module).apiMethods.forEach(methodName => {
        api[moduleName][methodName] = async (...args: any[]) => {
          if (authorized) {
            return await this.modules[moduleName][methodName](...args);
          } else {
            throw new Error('This app does not have permission to access this API. ' +
              `Required permissions: ${this.modules[moduleName].permissions}`);
          }
        };
      });
    });

    return api;
  }

}
