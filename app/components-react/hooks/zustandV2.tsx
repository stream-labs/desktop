import { StoreApi, useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import React, { Context, useContext, useEffect, useMemo } from 'react';
import { Draft } from 'immer';
import { Subscription } from 'rxjs';

/**
 * Initializes a Zustand store with the provided initial state, utilizing immer middleware.
 *
 */
export function initStore<TState extends any>(initialStateDraft: TState) {
  const initialState: TState = { ...(initialStateDraft as any) };
  const store = createStore<TState, [['zustand/immer', never]]>(immer(set => initialState));

  // Define shortcut getters for each property in initialState
  for (const key in initialState) {
    if ((initialState as any).hasOwnProperty(key)) {
      Object.defineProperty(store, key, {
        get() {
          return store.getState()[key];
        },
      });
    }
  }

  // Create a reactive hook for React components
  const useState = createBoundedUseStore(store);
  (store as any).useState = useState;

  const update = (key: keyof TState, value: any) =>
    store.setState((s: Draft<TState>) => {
      (s as any)[key] = value;
    });
  (store as any).update = update;

  // ensure we have correct types
  return store as typeof store & { useState: typeof useState } & {
    update: typeof update;
  } & Readonly<typeof initialStateDraft>;
}

/**
 * Creates a custom useStore hook that is bound to a specific Zustand store instance.
 * @see https://zustand.docs.pmnd.rs/guides/typescript#bounded-usestore-hook-for-vanilla-stores
 *
 * @template S The store API type.
 * @param store The Zustand store instance to bind the hook to.
 * @returns A custom hook bound to the provided store instance.
 */
const createBoundedUseStore = (store => (selector, equals) =>
  useStore(store, selector as never, equals)) as <S extends StoreApi<unknown>>(
  store: S,
) => {
  (): ExtractState<S>;
  <T>(selector: (state: ExtractState<S>) => T, equals?: (a: T, b: T) => boolean): T;
};

/**
 * Extracts the state type from a given Zustand store API.
 *
 * @template S The store API type.
 */
type ExtractState<S> = S extends { getState: () => infer X } ? X : never;

// React.createContext<StreamSchedulerController | null>(null);

export abstract class Controller {
  isSingleton = false;

  protected subscriptions = [] as Subscription[];
  protected onDestroy() {
    // override me
  }
  destroy() {
    this.onDestroy();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.isSingleton) {
      delete (this.constructor as any).singletonInstance;
    }

    console.log('GoLiveController destroyed');
  }
}

const DEFAULT_CONTEXT = React.createContext(null);

/**
 * A wrapper around React.useContext for controllers.
 * This hook ensures that the controller's actions are bound to the controller instance.
 * @param Controller
 */
export function useController<
  T extends { new (...args: any[]): any; singletonInstance?: InstanceType<T>; ctx?: Context<any> }
>(ControllerClass: T): NonNullable<InstanceType<T>> {
  // try to retrieve the controller from the React context
  let controller = useContext((ControllerClass.ctx || DEFAULT_CONTEXT) as any) as InstanceType<T>;

  // if controller not found in context than create a global singleton instance
  if (!controller) {
    if (ControllerClass.singletonInstance) {
      controller = ControllerClass.singletonInstance;
    } else {
      controller = new ControllerClass();
      controller.isSingleton = true;
      ControllerClass.singletonInstance = controller;
    }
  }

  // Bind the controller's actions to the controller instance.

  const actionsProcessed = controller._actionsProcessed;
  if (!actionsProcessed) {
    // Fetch the action names from the prototype of the service instance.
    const actionNames = Object.getOwnPropertyNames(Object.getPrototypeOf(controller));
    const actions: Record<string, any> = {};

    // Loop through the action names and bind them to the service instance.
    for (const actionName of actionNames) {
      // Skip the constructor and any non-function properties.
      if (actionName === 'constructor') continue;
      if (!(controller as any)[actionName]?.bind) continue;
      // Run initialize actions if they exist
      if (actionName === 'init') controller[actionName]();
      actions[actionName] = (controller as any)[actionName].bind(controller);
    }

    Object.assign(controller, actions);
  }

  // Run initialize actions if they exist
  // useMemo(() => {
  //   controller['init']?.();
  // });

  useEffect(() => {
    if (!actionsProcessed) {
      controller['onMount']?.();
      return () => controller.destroy();
    }
  }, []);

  controller._actionsProcessed = true;

  return controller;
}
