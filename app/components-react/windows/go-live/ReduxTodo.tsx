import React, { useEffect, useRef, useState } from 'react';
import { Provider, shallowEqual, useSelector } from 'react-redux';
import { Button } from 'antd';
import { useTodoFeature } from './useReduxTodo';
import Form from '../../shared/inputs/Form';
import { TextInput } from '../../shared/inputs';
import { store } from '../../store';

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
  const { count, listName } = useTodoFeature();
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
  const { markAllDone, markAllUndone, useSelector } = useTodoFeature();
  const { canMarkDone, canMarkUndone } = useSelector(context => {
    return {
      canMarkDone: context.items.filter(item => !item.done).length > 0,
      canMarkUndone: context.items.filter(item => item.done).length > 0,
    };
  });
  const [isEditMode, setIsEditMode] = useState(false);

  function toggleEditMode() {
    setIsEditMode(!isEditMode);
  }

  console.log('render buttons');
  return (
    <div>
      <Button>Add</Button>
      <Button>Delete</Button>
      <Button onClick={markAllDone} disabled={!canMarkDone}>
        Mark All Done
      </Button>
      <Button onClick={markAllUndone} disabled={!canMarkUndone}>
        Mark All Undone
      </Button>

      <Button onClick={toggleEditMode}>{isEditMode ? 'Save' : 'Edit title'}</Button>

      {isEditMode && <ReduxTodoEditName />}
    </div>
  );
}

export function ReduxTodoEditName() {
  console.log('render edit name');
  const { setListName, useBinding } = useTodoFeature();
  const bind = useBinding(
    context => {
      return context.state;
    },
    updatedState => setListName(updatedState.listName),
  );

  return <Form>{<TextInput label={'ListName'} {...bind.listName} />}</Form>;
}

export function ReduxTodoSources() {
  console.log('render sources');
  const { folders } = useTodoFeature();

  return (
    <ul>
      {folders.map(folder => (
        <li key={folder.id}>{folder.name}</li>
      ))}
    </ul>
  );
}
