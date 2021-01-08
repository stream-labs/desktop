import { getResource } from '../services/core';
import { AppServices } from '../app-services';

// maps a dictionary of classes to a dictionary of types
type TInstances<T extends { [key: string]: new (...args: any) => any }> = {
  [P in keyof T]: InstanceType<T[P]>;
};

/**
 * Provides access to a singleton services
 */
export const Services: TInstances<typeof AppServices> = new Proxy(
  {} as TInstances<typeof AppServices>,
  {
    get(target, propName, receiver) {
      return getResource(propName as string);
    },
  },
);
