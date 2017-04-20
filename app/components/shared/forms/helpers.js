import * as propsComponents from './index';

export function propertyComponentForType(type) {
  for (let componentName in propsComponents) {
    let component = propsComponents[componentName];
    if (component.obsType === type) return component;
  }
}
