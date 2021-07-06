import { useRef } from 'react';
import { createBinding, TBindings } from '../shared/inputs';
import { useOnCreate, useOnDestroy } from '../hooks';
import { ReduxModule, getModuleManager, useSelector, createDependencyWatcher } from '../store';
import { useComponentId } from './useComponentId';
import { lockThis, merge, TMerge } from '../../util/merge';

/**
 * A hoo for using ReduxModules in components
 * @param ModuleClass
 * @param initParams
 */
export function useModule<
  TInitParams,
  TState,
  TControllerClass extends new (...args: any[]) => ReduxModule<TInitParams, TState>,
  TBindingState,
  TBindingExtraProps,
  TReturnType extends InstanceType<TControllerClass> & {
    select: () => InstanceType<TControllerClass> &
      InstanceType<TControllerClass>['state'] & { module: InstanceType<TControllerClass> };

    selectExtra: <TComputedProps>(
      fn: (module: InstanceType<TControllerClass>) => TComputedProps,
    ) => InstanceType<TControllerClass> &
      TComputedProps & { module: InstanceType<TControllerClass> };
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
    const lockedModule = lockThis(module);

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
        const mergedModule = merge(
          () => lockedModule,
          () => module.state,
          () => computedPropsRef.current,
          () => ({ module }),
        );
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

  const mergeResult = merge(
    () => module,
    () => ({ select, selectExtra: select }),
  );
  return (mergeResult as unknown) as TReturnType;
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
