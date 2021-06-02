import { useEffect, useRef } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { StatefulService } from '../../services';
import { createBinding, TBindings } from '../shared/inputs';
import { assertIsDefined } from '../../util/properties-type-guards';
import { useOnCreate, useOnDestroy } from '../hooks';
import { StateManager } from '../store';

export function useFeature<
  TControllerClass extends new (...args: any[]) => { state: any },
  TState extends Object = InstanceType<TControllerClass>['state'],
  TReturnType = InstanceType<TControllerClass> & {
    useSelector<TComputed extends Object>(
      fn: (context: InstanceType<TControllerClass>) => TComputed,
    ): TComputed;
    useBinding: TUseBinding<InstanceType<TControllerClass>, TState>;
  }
>(ControllerClass: TControllerClass): TReturnType {
  const isRootRef = useRef(false);
  const prevComponentState = useRef<Partial<any>>({});
  const computedPropsFnRef = useRef<null | Function>(null);
  const computedPropsRef = useRef<any>({});

  const { stateManager, dependencyWatcher, dataSelector, calculateComputedProps } = useOnCreate(
    () => {
      let stateManager = StateManager.instances[ControllerClass.name];
      if (!stateManager) {
        isRootRef.current = true;
        const controller = new ControllerClass();
        stateManager = new StateManager(ControllerClass, controller.state);
      }

      function useSelector<T extends Object>(
        fn: (context: InstanceType<TControllerClass>) => T,
      ): T {
        if (!computedPropsFnRef.current) {
          computedPropsFnRef.current = fn;
          const computedProps = calculateComputedProps();
          Object.keys(computedProps).forEach(key => dependencyWatcher.watcherProxy[key]);
        }
        return (computedPropsRef.current as unknown) as T;
      }

      function calculateComputedProps() {
        const compute = computedPropsFnRef.current;
        if (!compute) return;
        return (computedPropsRef.current = compute(stateManager.controller));
      }

      const hooks = {
        useSelector,
      };

      const { controller, actionsAndGetters } = stateManager;

      const dependencyWatcher = createDependencyWatcher(
        new Proxy(
          { __proxyName: 'StateManagerDependencyWatcher' },
          {
            get(target, propName: string) {
              if (propName in hooks) {
                return hooks[propName];
              } else if (propName in actionsAndGetters) {
                return actionsAndGetters[propName];
              } else if (propName in computedPropsRef.current) {
                return computedPropsRef.current[propName];
              } else {
                return controller[propName];
              }
            },
          },
        ),
      );

      const dataSelector = () => stateManager.controller;

      return {
        stateManager,
        dependencyWatcher,
        dataSelector,
        calculateComputedProps,
      };
    },
  );

  useOnDestroy(() => {
    if (isRootRef.current) stateManager.destroy();
  });

  useSelector(dataSelector, () => {
    if (Object.keys(prevComponentState.current).length === 0) return true;
    calculateComputedProps();
    const isEqual = shallowEqual(
      prevComponentState.current,
      dependencyWatcher.getDependentValues(),
    );

    return isEqual;
  });

  useEffect(() => {
    const unsubscribe = StatefulService.store.watch(
      () => dependencyWatcher.getDependentValues(),
      newState => stateManager.incVuexRevision(),
    );
    return () => {
      unsubscribe();
    };
  }, []);

  // component mounted/updated
  useEffect(() => {
    // save the prev state
    prevComponentState.current = dependencyWatcher.getDependentValues();
  });

  return (dependencyWatcher.watcherProxy as unknown) as TReturnType;
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

export type TUseBinding<TView extends object, TState extends object> = (
  stateGetter: (view: TView) => TState,
  stateSetter: (patch: TState) => unknown,
) => TBindings<TState, keyof TState>;
