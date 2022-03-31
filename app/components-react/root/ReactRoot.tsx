import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { ReactModules } from 'slap';

/**
 * Creates a root React component with integrated Redux store
 */
export function createRoot(ChildComponent: (props: any) => JSX.Element) {
  return function ReactRoot(childProps: Object) {
    return (
      <Provider store={store}>
        <ReactModules>
          <ChildComponent {...childProps} />
        </ReactModules>
      </Provider>
    );
  };
}
