import { StoreApi, useStore } from 'zustand';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import React, { Context, useContext, useEffect, useMemo, useRef } from 'react';
import { Subscription } from 'rxjs';
import { shallow } from 'zustand/shallow';

/**
 * Initializes a Zustand store with the provided initial state,
 * utilizing immer middleware with correct types.
 */
export function initStore<TState extends object>(initialState: TState) {
  // create a store with immer middleware
  const useBaseStore = create<TState>()(immer(() => initialState));

  /*
  Create the useSelector hook with correct types.

  Why choosing `useSelector` instead of the `useStore` naming?

  Pros:
    - Avoids tautology when using in components as `store.useStore()`.
    - Clearly indicates that the hook is used to select state slices.
    - bonus: Familiar to those who have used Redux's useSelector.
  Cons:
   - Deviates from Zustand's standard naming, which might confuse some developers.
   */
  const useSelector: {
    (): TState;
    <StateSlice>(
      selector: (state: TState) => StateSlice,
      equalityFn?: (a: StateSlice, b: StateSlice) => boolean
    ): StateSlice;
  } = (selector?: any, equalityFn?) => {
    return useBaseStore(selector);
    // if (selector) {
    //   return useStoreBase(selector, equalityFn);
    // } else {
    //   return useStoreBase((state) => state as TState); // Ensure selector is a function
    // }
  };

  // create a shallow selector that uses shallow equality check by default
  // this is useful for performance optimization when the selected state slice is a primitive value
  const useShallowSelector = <StateSlice>(
    selector: (state: TState) => StateSlice
  ) => {
    return baseStore(selector, shallow);
  };

  const setState = useBaseStore.setState;
  const getState = useBaseStore.getState;

  return { useSelector, useShallowSelector, getState, setState, useBaseStore };
}



/**
 * Creates a custom useStore hook that is bound to a specific Zustand store instance.
 * @see https://zustand.docs.pmnd.rs/guides/typescript#bounded-usestore-hook-for-vanilla-stores
 *
 * @template S The store API type.
 * @param store The Zustand store instance to bind the hook to.
 * @returns A custom hook bound to the provided store instance.
 */
// const createBoundedUseStore = (store => (selector, equals) =>
//   useStore(store, selector as never, equals)) as <S extends StoreApi<unknown>>(
//   store: S,
// ) => {
//   (): ExtractState<S>;
//   <T>(selector: (state: ExtractState<S>) => T, equals?: (a: T, b: T) => boolean): T;
// };

/**
 * Extracts the state type from a given Zustand store API.
 *
 * @template S The store API type.
 */
type ExtractState<S> = S extends { getState: () => infer X } ? X : never;

// React.createContext<StreamSchedulerController | null>(null);

export abstract class Controller {
  isSingleton? = false;
  // Internal properties for managing initialization and reference count
  __isInitialized?: boolean;
  __refCount?: number;

  protected subscriptions? = [] as Subscription[];
  protected onDestroy?() {
    // override me
  }
  destroy?() {
    if (this.onDestroy) this.onDestroy();
    this.subscriptions?.forEach(sub => sub.unsubscribe());
    // if (this.isSingleton) {
    //   delete (this.constructor as any).singletonInstance;
    // }

    console.log('Controller destroyed');
  }
}

// const DEFAULT_CONTEXT = React.createContext(null);

/**
 * A wrapper around React.useContext for controllers.
 * This hook ensures that the controller's actions are bound to the controller instance.
 * @param Controller
 */
export function useController<T>(
  ControllerClass: new (...args: unknown[]) => T
): T {
  // Ensure that ctx is defined
  if (!ControllerClass.ctx) {
    ControllerClass.ctx = React.createContext<T | null>(null);
  }
  const controllerFromContext = useContext(ControllerClass.ctx);

  // Use useRef to store the controller instance
  const controllerRef = useRef<T>();

  if (!controllerRef.current) {
    if (controllerFromContext) {
      controllerRef.current = controllerFromContext;
    } else if (ControllerClass.singletonInstance) {
      controllerRef.current = ControllerClass.singletonInstance;
    } else {
      console.log('creating NEW CONTROLLER !');
      const newController = new ControllerClass();
      ControllerClass.singletonInstance = newController;
      controllerRef.current = newController;
    }
  }

  const controller = controllerRef.current;

  // Initialize the controller if not already initialized
  if (!controller.__isInitialized) {
        // Fetch the action names from the prototype of the service instance.
    const actionNames = Object.getOwnPropertyNames(Object.getPrototypeOf(controller));
    const actions: Record<string, any> = {};

    // Loop through the action names and bind them to the service instance.
    for (const actionName of actionNames) {
      // Skip the constructor and any non-function properties.
      if (actionName === 'constructor') continue;
      if (!(controller as any)[actionName]?.bind) continue;
      actions[actionName] = (controller as any)[actionName].bind(controller);
    }

    Object.assign(controller, actions);
    controller.__destroyFn = controller.init?.();
    controller.__isInitialized = true;
  }


  // Use a ref count to manage destroy
  useEffect(() => {
    controller.__refCount = (controller.__refCount || 0) + 1;
    console.log('New ref added', controller.__refCount);

    return () => {
      controller.__refCount! -= 1;
      console.log('Ref removed', controller.__refCount);
      if (controller.__refCount === 0) {
        console.log('destroyed GoLiveController');
        controller.__destroyFn?.(); // call the destroy function that was returned from init
        controller.destroy?.(); // call the destroy function if declared in the controller
        controller.__isInitialized = false;
        // If it's a singleton, remove the instance
        if (ControllerClass.singletonInstance === controller) {
          ControllerClass.singletonInstance = undefined;
        }
      }
    };
  }, [controller]);

  return controller;
}
