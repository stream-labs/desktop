import { configureStore, createSlice } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

interface ITodoState {
  items: ITodoItem[];
  status: 'idle' | 'loading' | 'failed';
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
};

export const todoSlice = createSlice({
  name: 'counter',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    markAllDone(state) {
      state.items.forEach(item => (item.done = true));
    },
    markAllUndone(state) {
      state.items.forEach(item => (item.done = true));
    },
  },
});

export const store = configureStore({
  reducer: {
    todo: todoSlice.reducer,
  },
});

export function useReduxTodo() {
  const items = useAppSelector((state: RootState) => state.todo.items);
  return {
    items,
    markAllDone: todoSlice.actions.markAllDone,
    markAllUndone: todoSlice.actions.markAllUndone,
  };
}
