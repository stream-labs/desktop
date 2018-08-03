import { ServicesManager } from '../services-manager';

/**
 * inject a service as a getter
 * if serviceName is missed it will try to use a property name to find the service
 */
export function Inject(serviceName?: string) {
  return function (target: Object, key: string) {
    Object.defineProperty(target, key, {
      get() {
        const name = serviceName || key.charAt(0).toUpperCase() + key.slice(1);
        const service = ServicesManager.instance.getService(name);
        if (!service) throw `Service not found: ${name}`;
        return service.instance;
      }
    });
  };
}
