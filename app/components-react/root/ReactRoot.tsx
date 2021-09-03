import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';

/**
 * Creates a root React component with integrated Redux store
 */
export function createRoot(ChildComponent: (props: any) => JSX.Element) {
  return function ReactRoot(childProps: Object) {
    console.log('re-render Root', childProps);
    return (
      <Provider store={store}>
        <ChildComponent {...childProps} />
      </Provider>
    );
  };
}
