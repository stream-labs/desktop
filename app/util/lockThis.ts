import { traverseClassInstance } from './traverseClassInstance';

/**
 * Re-bind this for all object's methods to ensure `this` is always defined
 * This method is useful if we extract methods from an objet this way:
 *
 * const { action1, action2 } = actions;
 */
export function lockThis<T extends object>(instance: T): T {
  const result = {};

  traverseClassInstance(instance, (propName, descriptor) => {
    if (descriptor.get || typeof instance[propName] !== 'function') {
      Object.defineProperty(result, propName, {
        get: () => {
          return instance[propName];
        },
      });
    } else {
      result[propName] = instance[propName].bind(instance);
    }
  });

  return result as T;
}
