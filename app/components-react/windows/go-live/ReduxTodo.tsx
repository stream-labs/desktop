import React, { useEffect, useRef, useState } from 'react';
import { Provider, shallowEqual, useSelector } from 'react-redux';
import { Button } from 'antd';
import { store, useTodoFeature } from './useReduxTodo';
import { createSelector } from '@reduxjs/toolkit';
import Form from '../../shared/inputs/Form';
import { TextInput } from '../../shared/inputs';

export function ReduxTodo() {
  console.log('render root');
  return (
    <React.StrictMode>
      <Provider store={store}>
        <div>This is redux comp</div>
        <ReduxTodoHeader />
        <ReduxTodoList />
        <ReduxTodoButtons />
        <ReduxTodoSources />
      </Provider>
    </React.StrictMode>
  );
}

export function ReduxTodoHeader() {
  console.log('render header');

  const { count } = useTodoFeature();
  const listName = 'Not impl';

  // const { count } = useSelector(selectCount, shallowEqual);
  return (
    <div>
      List {listName} Total items: {count} Done:{' '}
    </div>
  );
}

export function ReduxTodoList() {
  console.log('render list');

  const { items } = useTodoFeature();

  return (
    <ul>
      {items.map((item, ind) => (
        <li key={ind}>
          {item.title} done: {String(item.done)}
        </li>
      ))}
    </ul>
  );
}

export function ReduxTodoButtons() {
  // const { markAllDone, markAllUndone, useSelector } = useReduxTodo();
  // const { canMarkDone, canMarkUndone } = useSelector(view => {
  //   return {
  //     canMarkDone: view.items.filter(item => !item.done).length > 0,
  //     canMarkUndone: view.items.filter(item => item.done).length > 0,
  //   };
  // });
  const [isEditMode, setIsEditMode] = useState(false);

  function toggleEditMode() {
    setIsEditMode(!isEditMode);
  }

  console.log('render buttons');
  return (
    <div>
      <Button>Add</Button>
      <Button>Delete</Button>
      {/*<Button onClick={markAllDone} disabled={!canMarkDone}>*/}
      {/*  Mark All Done*/}
      {/*</Button>*/}
      {/*<Button onClick={markAllUndone} disabled={!canMarkUndone}>*/}
      {/*  Mark All Undone*/}
      {/*</Button>*/}

      <Button onClick={toggleEditMode}>{isEditMode ? 'Save' : 'Edit title'}</Button>

      {isEditMode && <ReduxTodoEditName />}
    </div>
  );
}

export function ReduxTodoEditName() {
  console.log('render edit name');
  // const { useBinding, setListName } = useReduxTodo();
  // const bind = useBinding(
  //   view => view.getState(),
  //   updatedState => setListName(updatedState.listName),
  // );

  return <Form>{/*<TextInput label={'ListName'} {...bind.listName} />*/}</Form>;
}

export function ReduxTodoSources() {
  // const items = useAppSelector((state: RootState) => state.todo.items);

  console.log('render sources');
  // const { sources } = []; //useReduxTodo();

  return (
    <ul>
      {/*{sources.map(source => (*/}
      {/*  <li key={source.id}>{source.name}</li>*/}
      {/*))}*/}
    </ul>
  );
}
