import * as appServices from '../app-services';
import { getResource } from '../services/core';

type TInstances<T extends { [key: string]: new (...args: any) => any }> = {
  [P in keyof T]: InstanceType<T[P]>;
};

export const Services: TInstances<typeof appServices> = new Proxy(
  {} as TInstances<typeof appServices>,
  {
    get(target, propName, receiver) {
      return getResource(propName as string);
    },
  },
);
