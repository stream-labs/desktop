import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { createApp, injectState, ReactModules } from 'slap';
import { getResource, StatefulService } from '../../services';
import { AppServices } from '../../app-services';

/**
 * This module adds reactivity support from Vuex
 * It ensures that React components will be re-rendered when Vuex updates their dependencies
 *
 */
class VuexModule {
  /**
   * Keep revisions for each StatefulService module in this state
   */
  state = injectState({
    revisions: {} as Record<string, number>,

    incrementRevision(statefulServiceName: string) {
      if (!this.revisions[statefulServiceName]) {
        this.revisions[statefulServiceName] = 1;
      } else {
        this.revisions[statefulServiceName]++;
      }
    },
  });

  onLoad() {
    // watch for mutations from the global Vuex store
    // and increment the revision number for affected StatefulService
    StatefulService.store.subscribe(mutation => {
      const serviceName = mutation.type.split('.')[0];
      this.state.incrementRevision(serviceName);
    });
  }
}

/**
 * Creates a root React component with integrated Redux store
 */
export function createRoot(ChildComponent: (props: any) => JSX.Element) {
  return function ReactRoot(childProps: Object) {
    const app = createApp({ VuexModule });
    const scope = app.rootScope;
    scope.init(VuexModule);

    Object.keys(AppServices).forEach(serviceName => {
      scope.register(() => getResource(serviceName), serviceName, { shouldCallHooks: false });
    });

    return (
      <Provider store={store}>
        <ReactModules app={app}>
          <ChildComponent {...childProps} />
        </ReactModules>
      </Provider>
    );
  };
}
