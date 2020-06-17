import { getResource } from 'services/core/injector';
import { AppService, IRunInLoadingModeOptions } from './app';
import { createDecorator } from 'vue-class-component';
import cloneDeep from 'lodash/cloneDeep';

/**
 * Method decorator
 * Set application to the loading mode while running the async method
 */
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

/**
 * Property decorator for Vue components
 * sync vModel with a local component value
 * every time when props.value is changed it updates the local value
 * every time when local value is changed it triggers the `input` event
 */
export function SyncWithValue() {
  return createDecorator((options, key) => {
    // create watchers and props.value if don't exist
    (options.props || (options.props = {}))['value'] = null;
    if (!options.watch) options.watch = {};

    let shouldSkipNextWatcher = true;

    // watch for the props.value
    options.watch['value'] = {
      immediate: true, // immediate call will setup the initial local value
      handler(newVal) {
        // update the local value
        this[key] = cloneDeep(newVal);
        // changing the prop should not trigger the `input` event
        // only changes of local value inside component should trigger this event
        shouldSkipNextWatcher = true;
      },
    };

    // watch for the local value
    options.watch[key] = {
      deep: true,
      handler(newVal) {
        if (!shouldSkipNextWatcher) {
          this['$emit']('input', cloneDeep(newVal));
        }
        shouldSkipNextWatcher = false;
      },
    };
  });
}
