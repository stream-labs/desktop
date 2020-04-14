import { getResource } from 'services/core/injector';
import { AppService, IRunInLoadingModeOptions } from './app';

// tslint:disable-next-line:function-name
export function RunInLoadingMode(options: IRunInLoadingModeOptions = {}): any {
  return function(target: any, methodName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]) {
      const appService = getResource<AppService>('AppService');
      return appService.runInLoadingMode(() => {
        return originalMethod.call(this, ...args);
      }, options);
    };
    return descriptor;
  };
}
