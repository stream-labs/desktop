import { ServicesManager } from 'services-manager';

/**
 * inject a service as a getter
 * if serviceName is missed it will try to use a property name to find the service
 *
 * @example
 *
 * class MyClass() {
 *   @Inject() appService: AppService;
 * }
 *
 * @example
 *
 * class MyClass() {
 *   @Inject('AppService') app: AppService;
 * }
 *
 */
// tslint:disable-next-line:function-name
export function Inject(serviceName?: string) {
  return function (target: Object, key: string) {
    Object.defineProperty(target, key, {
      get() {
        const name = serviceName || key.charAt(0).toUpperCase() + key.slice(1);
        const service = ServicesManager.instance.getService(name);
        if (!service) throw new Error(`Service not found: ${name}`);
        return service.instance;
      },
    });
  };
}

/**
 * importing ServicesManager to other ts files can cause dependency resolving issues
 * so use this method if you want to import some service or service-helper instance into a variable
 *
 * @example
 *  const appService = getResource<AppService>('AppService');
 */
export function getResource<T>(name: string): T {
  return ServicesManager.instance.getResource(name);
}
