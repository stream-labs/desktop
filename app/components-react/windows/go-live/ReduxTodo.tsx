import React from 'react';
import { Provider } from 'react-redux';
import { Button } from 'antd';
import { useReduxTodo } from './useReduxTodo';

export function ReduxTodo() {
  console.log('render root');
  return (
    <React.StrictMode>
      <div>This is redux comp</div>
      <ReduxTodoHeader />
      <ReduxTodoList />
      <ReduxTodoButtons />
    </React.StrictMode>
  );
}

export function ReduxTodoHeader() {
  console.log('render header');
  return <div>Total items: </div>;
}

export function ReduxTodoList() {
  const items = useReduxTodo();
  console.log('render list');
  return (
    <ul>
      {items.map((item, ind) => (
        <li key={ind}>
          {item.title} done: {item.done}
        </li>
      ))}
    </ul>
  );
}

export function ReduxTodoButtons() {
  console.log('render buttons');
  return (
    <div>
      <Button>Add</Button>
      <Button>Delete</Button>
    </div>
  );
}
