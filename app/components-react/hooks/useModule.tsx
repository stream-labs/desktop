import { useEffect, useRef } from 'react';
import { StatefulService } from '../../services';
import { createBinding, TBindings } from '../shared/inputs';
import { assertIsDefined } from '../../util/properties-type-guards';
import { useOnCreate, useOnDestroy } from '../hooks';
import { IStatefulModule, getModuleManager, useSelector, createDependencyWatcher } from '../store';
import isPlainObject from 'lodash/isPlainObject';
import { useComponentId } from './useComponentId';
import { lockThis, merge, TMerge } from '../../util/merge';

export function useModule<
  TInitParams,
  TState,
  TControllerClass extends new (...args: any[]) => IStatefulModule<TInitParams, TState>,
  TBindingState,
  TBindingExtraProps,
  TReturnType extends InstanceType<TControllerClass> & {
    select: () => InstanceType<TControllerClass> & InstanceType<TControllerClass>['state']; // SelectCreator<InstanceType<TControllerClass>>['select'] & TState; // () => InstanceType<TControllerClass>;

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
