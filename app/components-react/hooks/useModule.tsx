import { useRef } from 'react';
import { useOnCreate, useOnDestroy } from '../hooks';
import { IReduxModule, getModuleManager, useSelector, createDependencyWatcher } from '../store';
import { useComponentId } from './useComponentId';
import { merge } from '../../util/merge';
import { lockThis } from '../../util/lockThis';

/**
 * A hook for using ReduxModules in components
 *
 * @example 1
 * // get module instance in the component
 * const myModule = useModule(MyModule)
 *
 * // use Redux to select reactive props from the module
 * const { foo } = useSelector(() => ({ foo: myModule.foo }))
 *
 * @example 2
 * // same as example 1 but with one-liner syntax
 * const { foo } = useModule(MyModule).select()
 *
 * @example 3
 * // same as example 2 but with a computed prop
 * const { foo, fooBar } = useModule(MyModule)
 *  .selectExtra(module => { fooBar: module.foo + module.bar  }))
 */
function useModuleContext<
  TInitParams,
  TState,
  TModuleClass extends new (...args: any[]) => IReduxModule<TInitParams, TState>,
  TReturnType extends InstanceType<TModuleClass> & {
    select: () => InstanceType<TModuleClass> &
      InstanceType<TModuleClass>['state'] & { module: InstanceType<TModuleClass> };

    selectExtra: <TComputedProps>(
      fn: (module: InstanceType<TModuleClass>) => TComputedProps,
    ) => InstanceType<TModuleClass> & TComputedProps & { module: InstanceType<TModuleClass> };
  }
>(ModuleClass: TModuleClass, initParams?: TInitParams, moduleName = ''): TReturnType {
  const computedPropsFnRef = useRef<null | Function>(null);
  const computedPropsRef = useRef<any>({});
  const dependencyWatcherRef = useRef<any>(null);
  const componentId = useComponentId();
  moduleName = moduleName || ModuleClass.name;

  // register the component in the ModuleManager upon component creation
  const { module, select, selector } = useOnCreate(() => {
    // get existing module's instance or create a new one
    const moduleManager = getModuleManager();
    let module = moduleManager.getModule(moduleName);
    if (!module) {
      module = moduleManager.registerModule(new ModuleClass(), initParams, moduleName);
    }
    // register the component in the module
    moduleManager.registerComponent(moduleName, componentId);

    // lockedModule is a copy of the module where all methods have a persistent `this`
    // as if we called `module.methodName = module.methodName.bind(this)` for each method
    const lockedModule = lockThis(module);

    // calculate computed props that were passed via `.selectExtra()` call
    // and save them in `computedPropsRef`
    function calculateComputedProps() {
      const compute = computedPropsFnRef.current;
      if (!compute) return;
      const computedProps = compute(module);
      Object.assign(computedPropsRef.current, computedProps);
      return computedPropsRef.current;
    }

    // Create a public `.select()` method that allows to select reactive state for the component
    function select<TComputedProps>(
      fn?: (module: InstanceType<TModuleClass>) => TComputedProps,
    ): InstanceType<TModuleClass> & TComputedProps {
      // create DependencyWatcher as a source of state to select from
      if (!dependencyWatcherRef.current) {
        // calculate computed props if the function provided
        if (fn) {
          computedPropsFnRef.current = fn;
          calculateComputedProps();
        }
        // we have several sources of data to select from
        // use `merge` function to join them into a single object
        const mergedModule = merge(
          // allow to select variables from the module's state
          () => module.state,
          // allow to select getters and actions from the module
          () => lockedModule,
          // allow to select computed props
          () => computedPropsRef.current,
          // allow to select the whole module itself
          () => ({ module }),
        );
        dependencyWatcherRef.current = createDependencyWatcher(mergedModule);
      }
      return dependencyWatcherRef.current.watcherProxy;
    }

    // Create a Redux selector.
    // Redux calls this method every time when component's dependencies have been changed
    function selector() {
      // recalculate computed props
      calculateComputedProps();
      // select component's dependencies
      return dependencyWatcherRef.current?.getDependentValues();
    }

    return {
      module,
      selector,
      select,
    };
  });

  // unregister the component from the module onDestroy
  useOnDestroy(() => {
    getModuleManager().unRegisterComponent(moduleName, componentId);
  });

  // call Redux selector to make selected props reactive
  useSelector(selector);

  // return Module with extra `select` method
  // TODO: `.selectExtra()` is the same method as `.select()`
  //  and it was added here only because of typing issues related to multiple tsconfings in the project.
  //  We should use only the `.select` after resolving typing issues
  const mergeResult = merge(
    () => module,
    () => ({ select, selectExtra: select }),
  );
  return (mergeResult as unknown) as TReturnType;
}

/**
 * Get the Redux module instance from the current React context
 * Creates a new module instance if no instances exist
 */
export function useModule<
  TState,
  TModuleClass extends new (...args: any[]) => IReduxModule<unknown, TState>
>(ModuleClass: TModuleClass) {
  return useModuleContext(ModuleClass);
}

/**
 * Create a Redux module instance with given params
 */
export function useModuleRoot<
  TInitParams,
  TState,
  TModuleClass extends new (...args: any[]) => IReduxModule<TInitParams, TState>
>(ModuleClass: TModuleClass, initParams?: TInitParams, moduleName = '') {
  return useModuleContext(ModuleClass, initParams, moduleName);
}

/**
 * same as useModule but locates a module by name instead of a class
 */
export function useModuleByName<TModule extends IReduxModule<any, any>>(
  moduleName: string,
): TUseModuleReturnType<TModule> {
  const moduleManager = getModuleManager();
  const module = moduleManager.getModule(moduleName);
  if (!module) throw new Error(`Can not find module with name "${moduleName}" `);
  return (useModuleContext(
    module.constructor as new (...args: any[]) => IReduxModule<null, unknown>,
    null,
    moduleName,
  ) as unknown) as TUseModuleReturnType<TModule>;
}

type TUseModuleReturnType<TModule extends IReduxModule<any, any>> = TModule & {
  select: () => TModule & TModule['state'] & { module: TModule };
};
