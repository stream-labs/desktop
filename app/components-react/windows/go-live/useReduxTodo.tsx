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
import { store } from './reduxStore';

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
  status: 'idle' | 'loading' | 'failed';
  listName: string;
  isCreated: boolean;
  vuexIsInvalidated: boolean;
  vuexRevision: number;
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
  status: 'idle',
  listName: 'Default list',
  isCreated: false,
  vuexIsInvalidated: false,
  vuexRevision: 1,
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
    setIsCreated(state, action: PayloadAction<boolean>) {
      state.isCreated = action.payload;
    },
    setListName(state, action: PayloadAction<string>) {
      state.listName = action.payload;
    },
    setVuexIsInvalidated(state) {
      state.vuexIsInvalidated = true;
    },
    incrementVuexRevision(state) {
      state.vuexRevision = state.vuexRevision + 1;
      state.vuexIsInvalidated = false;
    },
  },
});

// export const store = configureStore({
//   reducer: {
//     todo: todoSlice.reducer,
//     temporaryStore: temporaryStoreSlice.reducer,
//   },
// });

export function useReduxTodo() {
  const dispatch = useAppDispatch();

  const isCreated = store.getState().todo.isCreated;
  const isRootRef = useRef(false);

  if (!isCreated) {
    isRootRef.current = true;
    dispatch(todoSlice.actions.setIsCreated(true));
  }
  const prevComponentState = useRef<Object>({});

  const { dependencyWatcher, componentView, onVuexChangeHandler } = useOnCreate(() => {
    function getState() {
      return store.getState().todo;
    }

    const getters = {
      getState,
      get count() {
        return getState().items.length;
      },
      get sources() {
        return Services.ScenesService.views
          .activeScene!.getItems()
          .map(s => ({ id: s.id, name: s.name }));
      },
    };

    const actions = {
      getState,
      markAllDone: () => {
        dispatch(todoSlice.actions.markAllDone());
      },
      markAllUndone: () => dispatch(todoSlice.actions.markAllUndone()),
      setListName: (name: string) => dispatch(todoSlice.actions.setListName(name)),
      setVuexIsInvalidated: () => dispatch(todoSlice.actions.setVuexIsInvalidated()),
      incrementVuexRevision: () => dispatch(todoSlice.actions.incrementVuexRevision()),
    };

    const componentView = merge(getState, getters, actions);
    function useSelector<T>(fn: (view: typeof componentView) => T): T {
      return useAppSelector(() => fn(componentView), shallowEqual);
    }

    const dependencyWatcher = createDependencyWatcher(merge(componentView, { useSelector }));

    async function onVuexChangeHandler() {
      if (getState().vuexIsInvalidated) return;
      componentView.setVuexIsInvalidated();
      await Utils.sleep(0);
      componentView.incrementVuexRevision();
    }

    return {
      dependencyWatcher,
      componentView,
      useSelector,
      onVuexChangeHandler,
    };
  });

  useAppSelector(
    state => componentView,
    (left, right) => {
      if (Object.keys(prevComponentState.current).length === 0) return true;
      const isEqual = shallowEqual(
        prevComponentState.current,
        dependencyWatcher.getDependentValues(),
      );

      return isEqual;
    },
  );

  useEffect(() => {
    const unsubscribe = StatefulService.store.watch(
      () => dependencyWatcher.getDependentValues(),
      newState => onVuexChangeHandler(),
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

  type TComponentView = typeof componentView;
  type TState = ReturnType<typeof componentView.getState>;
  return (dependencyWatcher.watcherProxy as unknown) as typeof dependencyWatcher.watcherProxy & {
    useBinding: TUseBinding<TComponentView, TState>;
  };
}

export function useStateManager<
  TState extends Object,
  TActionsAndGetters extends Object,
  TReducers = CreateSliceOptions<TState>
>(
  name: string,
  stateInitializer: () => [TState, TReducers],
  actionsAndGettersInitializer: (getState: () => TState, reducers: TReducers) => TActionsAndGetters,
) {
  const dispatch = useAppDispatch();

  const isCreated = store.getState().todo.isCreated;
  const isRootRef = useRef(false);

  if (!isCreated) {
    isRootRef.current = true;
    dispatch(todoSlice.actions.setIsCreated(true));
  }
  const prevComponentState = useRef<Object>({});
  const isRoot = isRootRef.current;

  const { dependencyWatcher, componentView, onVuexChangeHandler } = useOnCreate(() => {
    if (!isRoot) {
      return store.getContextView(name);
    }

    const helperState = {
      _vuexIsInvalidated: false,
      _vuexRevision: 1,
    };

    const [initialState, reducersInitializer] = stateInitializer();
    createReducer({ ...initialState, ...helperState }, reducersInitializer);
    store.add(name, reducersInitializer);
    const reducers = store.reducerManager.getReducerMap();

    function getState() {
      return store.getState()[name];
    }

    const actionsAndGetters = actionsAndGettersInitializer(getState, reducers);

    const contextView = merge(getState, reducers, actionsAndGetters);

    function useSelector<T>(fn: (view: typeof contextView) => T): T {
      return useAppSelector(() => fn(contextView), shallowEqual);
    }

    const dependencyWatcher = createDependencyWatcher(merge(contextView, { useSelector }));

    async function onVuexChangeHandler() {
      if (getState().vuexIsInvalidated) return;
      componentView.setVuexIsInvalidated();
      await Utils.sleep(0);
      componentView.incrementVuexRevision();
    }

    return {
      dependencyWatcher,
      componentView,
      useSelector,
      onVuexChangeHandler,
    };
  });

  useOnDestroy(() => {
    if (isRoot) store.remove(name);
  });

  useAppSelector(
    state => componentView,
    (left, right) => {
      if (Object.keys(prevComponentState.current).length === 0) return true;
      const isEqual = shallowEqual(
        prevComponentState.current,
        dependencyWatcher.getDependentValues(),
      );

      return isEqual;
    },
  );

  useEffect(() => {
    const unsubscribe = StatefulService.store.watch(
      () => dependencyWatcher.getDependentValues(),
      newState => onVuexChangeHandler(),
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

  type TComponentView = typeof componentView;
  type TState = ReturnType<typeof componentView.getState>;
  // return (dependencyWatcher.watcherProxy as unknown) as typeof dependencyWatcher.watcherProxy & {
  //   useBinding: TUseBinding<TComponentView, TState>;
  // };
}

function useTestFeature() {
  useStateManager('testFeature', () => {
    const initialState: ITodoState = {
      items: [
        { title: 'item1', done: true },
        { title: 'item2', done: false },
      ],
      status: 'idle',
      listName: 'Default list',
      isCreated: false,
      vuexIsInvalidated: false,
      vuexRevision: 1,
    };

    const reducers = {
      markAllDone(state) {
        state.items.forEach(item => (item.done = true));
      },
      markAllUndone(state) {
        state.items.forEach(item => (item.done = false));
      },
    };

    const getters = {};
  });
}
