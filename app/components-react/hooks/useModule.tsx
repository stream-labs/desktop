import { useEffect, useRef } from 'react';
import { StatefulService } from '../../services';
import { createBinding, TBindings } from '../shared/inputs';
import { assertIsDefined } from '../../util/properties-type-guards';
import { useOnCreate, useOnDestroy } from '../hooks';
import { IStatefulModule, getModuleManager, useSelector } from '../store';
import isPlainObject from 'lodash/isPlainObject';
import { useComponentId } from './useComponentId';
import { lockThis, merge, TMerge } from '../../util/merge';

export function useModule<
  TInitParams,
  TControllerClass extends new (...args: any[]) => IStatefulModule<TInitParams>,
  TBindingState,
  TBindingExtraProps,
  TReturnType extends InstanceType<TControllerClass> & {


    select: SelectCreator<InstanceType<TControllerClass>>['select']; // () => InstanceType<TControllerClass>;

    selectExtra: <TComputedProps>(
      fn: (module: InstanceType<TControllerClass>) => TComputedProps,
    ) => InstanceType<TControllerClass> & TComputedProps;

    // SelectCreator<InstanceType<TControllerClass>>['select'];
    // select:
    //   | (() => InstanceType<TControllerClass>)
    //   | (<TComputedProps>(
    //       fn: (module: InstanceType<TControllerClass>) => TComputedProps,
    //     ) => InstanceType<TControllerClass> & TComputedProps);

    useBinding: BindingCreator<InstanceType<TControllerClass>>['createBinding'];
  }
>(ModuleClass: TControllerClass, initParams?: TInitParams): TReturnType {
  const computedPropsFnRef = useRef<null | Function>(null);
  const computedPropsRef = useRef<any>({});
  const dependencyWatcherRef = useRef<any>(null);
  const moduleName = ModuleClass.name;
  const componentId = useComponentId();

  const { module, select, selector } = useOnCreate(() => {
    const moduleManager = getModuleManager();
    let module = moduleManager.getModule(moduleName);
    if (!module) {
      module = moduleManager.registerModule(new ModuleClass(), initParams);
    }
    moduleManager.registerComponent(moduleName, componentId);

    function calculateComputedProps() {
      const compute = computedPropsFnRef.current;
      if (!compute) return;
      const computedProps = compute(module);
      Object.assign(computedPropsRef.current, computedProps);
      return computedPropsRef.current;
    }

    function select<TComputedProps>(
      fn?: (module: InstanceType<TControllerClass>) => TComputedProps,
    ): InstanceType<TControllerClass> & TComputedProps {
      if (!dependencyWatcherRef.current) {
        if (fn) computedPropsFnRef.current = fn;
        const mergedModule = merge(module, computedPropsRef.current);
        dependencyWatcherRef.current = createDependencyWatcher(mergedModule);
      }
      return dependencyWatcherRef.current.watcherProxy;
    }

    function selector() {
      calculateComputedProps();
      return dependencyWatcherRef.current?.getDependentValues();
    }

    return {
      module,
      selector,
      select,
    };
  });

  useOnDestroy(() => {
    getModuleManager().unRegisterComponent(moduleName, componentId);
  });

  useSelector(selector);

  const mergeResult = merge(module, { select, selectExtra: select });
  return (mergeResult as unknown) as TReturnType;
}

/**
 * Tracks read operations on the object
 *
 * @example
 *
 * const myObject = { foo: 1, bar: 2, qux: 3};
 * const { watcherProxy, getDependentFields } = createDependencyWatcher(myObject);
 * const { foo, bar } = watcherProxy;
 * getDependentFields(); // returns ['foo', 'bar'];
 *
 */
export function createDependencyWatcher<T extends object>(watchedObject: T) {
  const dependencies: Record<string, any> = {};
  const watcherProxy = new Proxy(
    {
      _proxyName: 'DependencyWatcher',
      useBinding,
    },
    {
      get: (target, propName: string) => {
        // if (propName === 'hasOwnProperty') return watchedObject.hasOwnProperty;
        if (propName in target) return target[propName];
        const value = watchedObject[propName];

        // Input bindings that have been created via createBinding() are source of
        // component's dependencies. We should handle them differently
        if (value && value._proxyName === 'Binding') {
          // if we already have the binding in the deps, just return it
          if (propName in dependencies) {
            return dependencies[propName];
          } else {
            // if it's the first time we access binding then clone it to dependencies
            // the binding object keep its own dependencies and cloning will reset them
            // that ensures each component will have it's own dependency list for the each binding
            dependencies[propName] = value._binding.clone();
            return dependencies[propName];
          }
        } else {
          // for non-binding objects just save their value in the dependencies
          dependencies[propName] = value;
          return value;
        }
      },
    },
  ) as T;

  function getDependentFields() {
    return Object.keys(dependencies);
  }

  function getDependentValues(): Partial<T> {
    const values: Partial<T> = {};
    Object.keys(dependencies).forEach(propName => {
      const value = dependencies[propName];
      // if one of dependencies is a binding then expose its internal dependencies
      if (value && value._proxyName === 'Binding') {
        const bindingMetadata = value._binding;
        Object.keys(bindingMetadata.dependencies).forEach(bindingPropName => {
          values[`${bindingPropName}__binding-${bindingMetadata.id}`] =
            dependencies[propName][bindingPropName].value;
        });
        return;
      }
      // if it's not a binding then just take the value from the watchedObject
      values[propName] = watchedObject[propName];
    });
    return values;
  }

  /**
   * Hook for creating an reactive input binding
   */
  function useBinding<TState extends object>(
    stateGetter: (view: T) => TState,
    stateSetter: (patch: TState) => unknown,
  ): TBindings<TState, keyof TState> {
    const bindingRef = useRef<TBindings<TState, keyof TState>>();
    if (!bindingRef.current) {
      const binding = createBinding(() => stateGetter(watchedObject), stateSetter);
      dependencies[binding._binding.id] = binding;
      bindingRef.current = binding;
    }
    assertIsDefined(bindingRef.current);
    return bindingRef.current;
  }

  return { watcherProxy, getDependentFields, getDependentValues };
}

export type TUseBinding<TView extends Object, TState extends Object, TExtraProps = {}> = (
  stateGetter: (view: TView) => TState,
  stateSetter: (patch: TState) => unknown,
) => TBindings<TState, keyof TState, TExtraProps>;

class BindingCreator<TView> {
  createBinding<TState extends Object, TExtraProps extends Object = {}>(
    getter: (view: TView) => TState,
    setter: (newState: TState) => unknown,
    extraPropsGenerator?: (fieldName: keyof TState) => TExtraProps,
  ) {
    let view: TView;

    return createBinding(() => getter(view), setter, extraPropsGenerator);
  }
}

class SelectCreator<TModule> {
  select(): TModule;
  select<TComputedFn extends (module: TModule) => any, TComputedProps = ReturnType<TComputedFn>>(
    fn: TComputedFn,
  ): TModule & TComputedProps;
  select(...args: any[]): any {
    let module!: TModule;
    return {} as any;
  }
}
// type fooType = {
//   foo: string;
// };
//
// let select!: SelectCreator<fooType>['select'];
//
// const foo = select();
// foo.foo;
//
// const fooBar = select(foo => ({ bar: 1 }));
// fooBar.bar;

// function select<
//   TModule,
//   TComputedPropsCb,
//   TComputedProps = TComputedPropsCb extends Function ? ReturnType<TComputedPropsCb> : {}
//
//   // TComputedPropsCb, // = ((module: TModule) => any) | null, // function for calculating the computed props
//   // TComputedProps = TComputedPropsCb extends (...args: [TModule]) => infer R ? R : {} // computed props type
// >(fn: TComputedPropsCb): TModule & TComputedProps {
//   return ({} as unknown) as TModule & TComputedProps;
// }

// function select<TModule, TComputedProps>(
//   cb: (module: TModule) => TComputedProps,
// ): TModule & TComputedProps {
//   return ({} as unknown) as TModule & TComputedProps;
// }

// function select<TModule>(cb?: (module: TModule) => any) {
//   let module!: TModule;
//   return Object.assign(cb() || {}, module);
// }

// function select<TModule, TComputed>(module: TModule): TModule;
// function select<TModule, TComputed>(
//   module: TModule,
//   selector: (module: TModule) => TComputed,
// ): TModule & TComputed {
//   return Object.assign(selector(), module);
// }
//
// // const st: typeof select;
//
// type fooType = {
//   foo: string;
// };
//
// // const fooObj = select<fooType>();
// const fooAndBarObj = select({ foo: 'foo' }, module => ({ bar: 1 }));
// fooAndBarObj.bar;
/**
 * Returns a new object without function props
 * @param obj
 */
function removeFunctions(obj: Record<string, any>): Record<string, any> {
  const result = {};
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] !== 'function') result[key] = obj[key];
  });
  return result;
}
