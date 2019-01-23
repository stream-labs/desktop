import { getResource } from 'util/injector';
import { AppService } from './app';

// tslint:disable-next-line:function-name
export function RunInLoadingMode(): any {
  return function(target: any, methodName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]) {
      const appService = getResource<AppService>('AppService');
      return appService.runInLoadingMode(() => {
        return originalMethod.call(this, ...args);
      });
    };
    return descriptor;
  };
}
