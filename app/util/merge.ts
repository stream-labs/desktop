import { isPlainObject, flatten } from 'lodash';

/**
 * Merge multiple objects in one without reading their props
 * Ensures the result object is read-only
 *
 * @example merge 2 objects and a function
 *
 * const obj1 = { propOne: 1 };
 * const obj2 = { propTwo: 2 };
 * let propThree = 3;
 * const fn = () => ({ propThree })
 *
 * const result = merge(obj1, obj2, fn);
 * result.propOne; // returns 1
 * result.propTwo; // returns 2
 * result.propThree; // returns 3
 *
 * propThree = 99
 *
 * result.propThree; // returns 99
 *
 *
 * @example merge an object and a class instance
 * const date = new Date();
 * const { message: 'Today is'}
 * const result = merge(message, date);
 * console.log(result.message, result.toDateString()); // prints Today is %date%
 *
 */
export function merge<
  T1 extends Object,
  T2 extends Object,
  T3 extends Object,
  T4 extends Object,
  FN3 extends () => T3,
  FN4 extends () => T4,
  TReturnType = FN4 extends undefined
    ? FN3 extends undefined
      ? TMerge<T1, T2>
      : TMerge3<T1, T2, T3>
    : TMerge4<T1, T2, T3, T4>
>(...functions: [() => T1, () => T2, FN3?, FN4?]): TReturnType {
  const result = functions.reduce((a, val) => mergeTwo(a as unknown, val as unknown));
  return (result as unknown) as TReturnType;
}

export type TMerge<
  T1,
  T2,
  TObj1 = T1 extends (...args: any[]) => infer R1 ? R1 : T1,
  TObj2 = T2 extends (...args: any[]) => infer R2 ? R2 : T2,
  R extends object = Omit<TObj1, keyof TObj2> & TObj2
> = R;

export type TMerge3<T1, T2, T3> = TMerge<TMerge<T1, T2>, T3>;
export type TMerge4<T1, T2, T3, T4> = TMerge<TMerge3<T1, T2, T3>, T4>;
//
// export function mergeTwo<T1 extends object, T2 extends object, TReturnType = TMerge<T1, T2>>(
//   obj1: T1,
//   obj2: T2,
// ): TReturnType {
//   const proxyMetadata = { _proxyName: 'MergeResult', _mergedObjects: [obj1, obj2] };
//
//   // if the object is class instance like ServiceView then rebind `this` for its methods
//   if (typeof obj1 !== 'function' && !isPlainObject(obj1)) {
//     obj1 = lockThis(obj1);
//   }
//
//   if (typeof obj2 !== 'function' && !isPlainObject(obj2)) {
//     obj2 = lockThis(obj2);
//   }
//
//   function hasOwnProperty(propName: string) {
//     return propName in obj2 || propName in obj1;
//   }
//
//   // // if the object is class instance like ServiceView then rebind `this` for its methods
//   // if (typeof obj1 !== 'function' && !isPlainObject(obj1)) {
//   //   obj1 = lockThis(obj1);
//   // }
//
//   return (new Proxy(proxyMetadata, {
//     get(t, propName: string) {
//       if (propName === 'hasOwnProperty') return hasOwnProperty;
//       if (propName in proxyMetadata) return proxyMetadata[propName];
//       // if (propName === '_proxyName') return proxyMetadata._proxyName;
//       if (propName in obj2) return obj2[propName];
//       if (propName in obj1) return obj1[propName];
//     },
//
//     has(oTarget, propName: string) {
//       return hasOwnProperty(propName);
//     },
//     // set: (target, propName: string, val) => {
//     //   if (propName.startsWith('_')) {
//     //     metadata[propName] = val;
//     //     return true;
//     //   } else {
//     //     throw new Error('Can not change property on readonly object');
//     //   }
//     // },
//   }) as unknown) as TReturnType;
// }

export function mergeTwo<T1 extends Object, T2 extends Object, TReturnType = TMerge<T1, T2>>(
  target1: (() => T1) | T1,
  target2: (() => T2) | T2,
): TReturnType {
  const proxyMetadata = {
    _proxyName: 'MergeResult',
    get _mergedObjects() {
      return [target1, target2];
    },
  };

  // // if the object is class instance like ServiceView then rebind `this` for its methods
  // if (typeof obj1 !== 'function' && !isPlainObject(obj1)) {
  //   obj1 = lockThis(obj1);
  // }
  //
  // if (typeof obj2 !== 'function' && !isPlainObject(obj2)) {
  //   obj2 = lockThis(obj2);
  // }

  function hasOwnProperty(propName: string) {
    const obj = getObject(propName);
    return obj && propName in obj;
  }

  function getObject(propName: string) {
    if (target2['_proxyName'] === 'MergeResult' && propName in target2) {
      return target2;
    } else if (typeof target2 === 'function') {
      const obj2 = (target2 as Function)();
      if (propName in obj2) return obj2;
    }

    if (target1['_proxyName'] === 'MergeResult' && propName in target1) {
      return target1;
    } else if (typeof target1 === 'function') {
      const obj1 = (target1 as Function)();
      if (propName in obj1) return obj1;
    }
  }

  // // if the object is class instance like ServiceView then rebind `this` for its methods
  // if (typeof obj1 !== 'function' && !isPlainObject(obj1)) {
  //   obj1 = lockThis(obj1);
  // }

  return (new Proxy(proxyMetadata, {
    get(t, propName: string) {
      if (propName === 'hasOwnProperty') return hasOwnProperty;
      if (propName in proxyMetadata) return proxyMetadata[propName];
      const obj = getObject(propName);
      if (obj) return obj[propName];
    },

    has(oTarget, propName: string) {
      return hasOwnProperty(propName);
    },
    // set: (target, propName: string, val) => {
    //   if (propName.startsWith('_')) {
    //     metadata[propName] = val;
    //     return true;
    //   } else {
    //     throw new Error('Can not change property on readonly object');
    //   }
    // },
  }) as unknown) as TReturnType;
}

/**
 * Re-bind this for all object's methods to ensure `this` is always defined
 * if we extract methods from an objet this way:
 *
 * const { action1, action2 } = actions;
 */
export function lockThis<T extends object>(instance: T): T {
  let entity = instance;
  const prototypes = [];
  while (entity.constructor.name !== 'Object') {
    prototypes.push(entity);
    entity = Object.getPrototypeOf(entity);
  }

  const result = {};

  prototypes.forEach(proto => {
    Object.getOwnPropertyNames(proto).forEach(propName => {
      if (propName in result) return;
      const descriptor = Object.getOwnPropertyDescriptor(proto, propName);
      if (!descriptor) return;
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
  });

  return result as T;
}
