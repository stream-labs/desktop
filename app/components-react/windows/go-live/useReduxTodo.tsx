import {
  configureStore,
  createEntityAdapter,
  createReducer,
  createSlice,
  CreateSliceOptions,
  PayloadAction,
} from '@reduxjs/toolkit';
import { shallowEqual, TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { createBinding, TBindings } from '../../shared/inputs';
import { useEffect, useRef, useState } from 'react';
import { assertIsDefined } from '../../../util/properties-type-guards';
import { useOnCreate, useOnDestroy } from '../../hooks';
import { createDependencyWatcher, merge, TUseBinding } from '../../hooks/useStateManager';
import { type } from 'os';
import { SourcesService } from '../../../services/sources';
import { Services } from '../../service-provider';
import { StatefulService } from '../../../services';
import Utils from '../../../services/utils';

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

const temporaryStoreAdapter = createEntityAdapter();

const temporaryStoreSlice = createSlice({
  name: 'temporaryStore',
  initialState: temporaryStoreAdapter.getInitialState(),
  reducers: {
    addOne: temporaryStoreAdapter.addOne,
  },
});

interface ITodoState {
  items: ITodoItem[];
  listName: string;
}

interface ITodoItem {
  title: string;
  done: boolean;
}

const initialState: ITodoState = {
  items: [
    { title: 'item1', done: true },
    { title: 'item2', done: false },
  ],
  listName: 'Default list',
};

export const todoSlice = createSlice({
  name: 'todo',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    markAllDone(state) {
      state.items.forEach(item => (item.done = true));
    },
    markAllUndone(state) {
      state.items.forEach(item => (item.done = false));
    },
    setListName(state, action: PayloadAction<string>) {
      state.listName = action.payload;
    },
    // setVuexIsInvalidated(state) {
    //   state.vuexIsInvalidated = true;
    // },
    // incrementVuexRevision(state) {
    //   state.vuexRevision = state.vuexRevision + 1;
    //   state.vuexIsInvalidated = false;
    // },
  },
});

export const store = configureStore({
  reducer: {
    todo: todoSlice.reducer,
    temporaryStore: temporaryStoreSlice.reducer,
  },
});

// export function useReduxTodo() {
//   const dispatch = useAppDispatch();
//
//   const isCreated = store.getState().todo.isCreated;
//   const isRootRef = useRef(false);
//
//   if (!isCreated) {
//     isRootRef.current = true;
//     dispatch(todoSlice.actions.setIsCreated(true));
//   }
//   const prevComponentState = useRef<Object>({});
//
//   const { dependencyWatcher, componentView, onVuexChangeHandler } = useOnCreate(() => {
//     function getState() {
//       return store.getState().todo;
//     }
//
//     const getters = {
//       getState,
//       get count() {
//         return getState().items.length;
//       },
//       get sources() {
//         return Services.ScenesService.views
//           .activeScene!.getItems()
//           .map(s => ({ id: s.id, name: s.name }));
//       },
//     };
//
//     const actions = {
//       getState,
//       markAllDone: () => {
//         dispatch(todoSlice.actions.markAllDone());
//       },
//       markAllUndone: () => dispatch(todoSlice.actions.markAllUndone()),
//       setListName: (name: string) => dispatch(todoSlice.actions.setListName(name)),
//       setVuexIsInvalidated: () => dispatch(todoSlice.actions.setVuexIsInvalidated()),
//       incrementVuexRevision: () => dispatch(todoSlice.actions.incrementVuexRevision()),
//     };
//
//     const componentView = merge(getState, getters, actions);
//     function useSelector<T>(fn: (view: typeof componentView) => T): T {
//       return useAppSelector(() => fn(componentView), shallowEqual);
//     }
//
//     const dependencyWatcher = createDependencyWatcher(merge(componentView, { useSelector }));
//
//     async function onVuexChangeHandler() {
//       if (getState().vuexIsInvalidated) return;
//       componentView.setVuexIsInvalidated();
//       await Utils.sleep(0);
//       componentView.incrementVuexRevision();
//     }
//
//     return {
//       dependencyWatcher,
//       componentView,
//       useSelector,
//       onVuexChangeHandler,
//     };
//   });
//
//   useAppSelector(
//     state => componentView,
//     (left, right) => {
//       if (Object.keys(prevComponentState.current).length === 0) return true;
//       const isEqual = shallowEqual(
//         prevComponentState.current,
//         dependencyWatcher.getDependentValues(),
//       );
//
//       return isEqual;
//     },
//   );
//
//   useEffect(() => {
//     const unsubscribe = StatefulService.store.watch(
//       () => dependencyWatcher.getDependentValues(),
//       newState => onVuexChangeHandler(),
//     );
//     return () => {
//       unsubscribe();
//     };
//   }, []);
//
//   // component mounted/updated
//   useEffect(() => {
//     // save the prev state
//     prevComponentState.current = dependencyWatcher.getDependentValues();
//   });
//
//   type TComponentView = typeof componentView;
//   type TState = ReturnType<typeof componentView.getState>;
//   return (dependencyWatcher.watcherProxy as unknown) as typeof dependencyWatcher.watcherProxy & {
//     useBinding: TUseBinding<TComponentView, TState>;
//   };
// }

// export function useTodoFeature() {
//   useStateManager(() => {
//     const initialState = {
//       items: [
//         { title: 'item1', done: true },
//         { title: 'item2', done: false },
//       ],
//       listName: 'Default list',
//     };
//
//     const getters = {
//       get count() {
//         return 0;
//       },
//     };
//
//     const mutations = {
//       markAllDone(state) {
//         state.items.forEach(item => (item.done = true));
//       },
//       markAllUndone(state) {
//         state.items.forEach(item => (item.done = false));
//       },
//     };
//
//     const actions = {
//       showAlert() {
//         alert('This is alert');
//       },
//     };
//
//     return { initialState, getters, mutations, actions };
//   });
// }

abstract class StateManager<TState extends Object> {
  static instances: Record<string, StateManager<Object>> = {};
  private name: string;
  // public initialState: TState;

  abstract get initialState(): TState;
  protected state: TState;
  public readonly dependencyWatcher: ReturnType<typeof createDependencyWatcher>;

  get watcherProxy() {
    return this.dependencyWatcher.watcherProxy as this & TState;
  }

  constructor() {
    this.name = this.constructor.name;
    // this.state = this.initialState;
    StateManager.instances[name] = this;
    // const slice = createSlice({
    //   name: this.constructor.name,
    //   initialState: this.constructor.initialState,
    //   reducers: this.constructor.mutations,
    // });
    // store.add(name, slice.reducer);
    this.initState();
    this.dependencyWatcher = createDependencyWatcher(this.getContext());
  }

  private initState() {
    this.state = this.initialState;
  }

  destroy() {
    delete StateManager.instances[this.name];
  }

  useSelector<T>(fn: (stateManager: this) => T): T {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAppSelector(() => fn(this), shallowEqual);
  }

  getState() {
    return this.state;
  }

  getContext(): this & TState {
    const self = this;
    return (new Proxy(
      {
        _proxyName: 'stateManagerContext',
      },
      {
        get(t, propName: string) {
          if (self.hasOwnProperty(propName)) {
            return self[propName];
          } else {
            return self.state[propName];
          }
        },
      },
    ) as unknown) as this & TState;
  }
}

export function useStateManager<
  TStateManagerClass extends new (...args: any[]) => StateManager<any>
>(StateManagerClass: TStateManagerClass): InstanceType<TStateManagerClass> {
  const isRootRef = useRef(false);
  const prevComponentState = useRef<Object>({});

  const stateManager = useOnCreate(() => {
    let stateManager = StateManager.instances[name];
    if (!stateManager) {
      isRootRef.current = true;
      stateManager = new StateManagerClass();
    }
    return stateManager as InstanceType<TStateManagerClass>;
  });

  useOnDestroy(() => {
    if (isRootRef.current) stateManager.destroy();
  });

  // useAppSelector(
  //   state => stateManager,
  //   (left, right) => {
  //     if (Object.keys(prevComponentState.current).length === 0) return true;
  //     const isEqual = shallowEqual(
  //       prevComponentState.current,
  //       stateManager.dependencyWatcher.getDependentValues(),
  //     );
  //
  //     return isEqual;
  //   },
  // );

  // useEffect(() => {
  //   const unsubscribe = StatefulService.store.watch(
  //     () => dependencyWatcher.getDependentValues(),
  //     newState => onVuexChangeHandler(),
  //   );
  //   return () => {
  //     unsubscribe();
  //   };
  // }, []);

  // component mounted/updated
  useEffect(() => {
    // save the prev state
    prevComponentState.current = stateManager.dependencyWatcher.getDependentValues();
  });

  return stateManager;
}

export function mutation() {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const className = target.constructor.name;
    const mutationName = `${methodName}`;

    target.originalMethods = target.originalMethods || {};
    target.originalMethods[methodName] = target[methodName];
    target.mutations = target.mutations || {};
    target.mutations[mutationName] = function (
      localState: any,
      payload: { args: any; constructorArgs: any },
    ) {
      console.log('Mutation called', mutationName);
    };
  };
}

class TodoFeature extends StateManager<ITodoState> {
  get initialState() {
    return {
      items: [
        { title: 'item1', done: true },
        { title: 'item2', done: false },
      ],
      listName: 'Default list',
    };
  }

  get count() {
    return this.state.items.length;
  }

  @mutation()
  markAllDone() {
    this.state.items.forEach(item => (item.done = true));
  }

  @mutation()
  markAllUndone() {
    this.state.items.forEach(item => (item.done = false));
  }

  showAlert() {
    alert('this is alert');
  }
}

export function useTodoFeature() {
  const stateManager = useStateManager(TodoFeature);
  return stateManager.watcherProxy;
}

// export function useTodoFeature() {
//   useStateManager(() => {
//     const initialState = {
//       items: [
//         { title: 'item1', done: true },
//         { title: 'item2', done: false },
//       ],
//       listName: 'Default list',
//     };
//
//     const getters = {
//       get count() {
//         return 0;
//       },
//     };
//
//     const mutations = {
//       markAllDone(state) {
//         state.items.forEach(item => (item.done = true));
//       },
//       markAllUndone(state) {
//         state.items.forEach(item => (item.done = false));
//       },
//     };
//
//     const actions = {
//       showAlert() {
//         alert('This is alert');
//       },
//     };
//
//     return { initialState, getters, mutations, actions };
//   });
// }

// export function useStateManager<
//   TState extends Object,
//   TMutations extends { [key: string]: (state: TState) => TState },
//   TContext extends Object
// >(
//   name: string,
//   initialState: TState,
//   initializer: (
//     getState: () => () => TState,
//     createMutations: (mutations: TMutations) => TMutations,
//   ) => TContext,
//   // stateInitializer: () => [TState, TReducers],
//   // actionsAndGettersInitializer: (getState: () => TState, reducers: TReducers) => TActionsAndGetters,
// ) {
//   const dispatch = useAppDispatch();
//
//   const isCreated = store.getState().todo.isCreated;
//   const isRootRef = useRef(false);
//
//   if (!isCreated) {
//     isRootRef.current = true;
//     dispatch(todoSlice.actions.setIsCreated(true));
//   }
//   const prevComponentState = useRef<Object>({});
//   const isRoot = isRootRef.current;
//
//   const { dependencyWatcher, context } = useOnCreate(() => {
//     // if (!isRoot) {
//     //   return store.getContextView(name);
//     // }
//
//     // we change this state when we receive mutations from vuex
//     // so dependent components will be re-rendered
//     // const helperState = {
//     //   _vuexIsInvalidated: false,
//     //   _vuexRevision: 1,
//     // };
//
//     function createMutations(mutations: TMutations) {
//       return mutations;
//     }
//
//     function getState() {
//       return initialState;
//     }
//
//     const { getters, mutations, actions } = initializer(getState, createMutations);
//     const slice = createSlice({
//       name,
//       initialState,
//       reducers: mutations,
//     });
//
//     // createReducer(initialState, mutations);
//     store.add(name, slice.reducer);
//     const reducers = store.reducerManager.getReducerMap();
//
//     // function getState() {
//     //   return store.getState()[name];
//     // }
//
//     const context = {
//       ...actions,
//       ...mutations,
//       ...getters,
//     };
//
//     function useSelector<T>(fn: (view: typeof context) => T): T {
//       return useAppSelector(() => fn(context), shallowEqual);
//     }
//
//     const dependencyWatcher = createDependencyWatcher({ ...context, useSelector });
//
//     // async function onVuexChangeHandler() {
//     //   if (getState().vuexIsInvalidated) return;
//     //   componentView.setVuexIsInvalidated();
//     //   await Utils.sleep(0);
//     //   componentView.incrementVuexRevision();
//     // }
//
//     return {
//       dependencyWatcher,
//       context,
//       // onVuexChangeHandler,
//     };
//   });
//
//   useOnDestroy(() => {
//     if (isRoot) store.remove(name);
//   });
//
//   useAppSelector(
//     state => context,
//     (left, right) => {
//       if (Object.keys(prevComponentState.current).length === 0) return true;
//       const isEqual = shallowEqual(
//         prevComponentState.current,
//         dependencyWatcher.getDependentValues(),
//       );
//
//       return isEqual;
//     },
//   );
//
//   // useEffect(() => {
//   //   const unsubscribe = StatefulService.store.watch(
//   //     () => dependencyWatcher.getDependentValues(),
//   //     newState => onVuexChangeHandler(),
//   //   );
//   //   return () => {
//   //     unsubscribe();
//   //   };
//   // }, []);
//
//   // component mounted/updated
//   useEffect(() => {
//     // save the prev state
//     prevComponentState.current = dependencyWatcher.getDependentValues();
//   });
//
//   return {
//     dependencyWatcher: dependencyWatcher.watcherProxy as TComponentView,
//     context,
//     isRoot,
//   };
// }
//
// function useMyFeature() {
//   const actions = {
//     foo() {
//       return 1;
//     },
//     bar() {
//       return 'bar';
//     },
//   };
//
//   const getters = {
//     get count() {
//       return 3;
//     },
//   };
//   const managerResult = useMyManager(actions, getters);
//   return managerResult;
// }
//
// function useMyManager<T extends Object, TGetters extends Object>(
//   actions: T,
//   getters: TGetters,
// ): T & TGetters & { additionalFeature: number } {
//   const additionalFeatures = {
//     additionalFeature: 1,
//   };
//   return merge(
//     {
//       ...actions,
//       ...additionalFeatures,
//     },
//     getters,
//   );
// }
//
