import React from 'react';
import { createApp, Dict, inject, injectState, ReactModules, Store, TAppContext } from 'slap';
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
  // state = injectState({
  //   revisions: {} as Record<string, number>,
  //
  //   incrementRevision(statefulServiceName: string) {
  //     if (!this.revisions[statefulServiceName]) {
  //       this.revisions[statefulServiceName] = 1;
  //     } else {
  //       this.revisions[statefulServiceName]++;
  //     }
  //   },
  // });

  store = inject(Store);

  modules: Dict<any> = {};

  init() {
    StatefulService.onStateRead = serviceName => {
      // integrate tracking Vuex dependencies with ReactModules
      if (this.store.recordingAccessors) {
        const module = this.resolveModule(serviceName);
        this.store.affectedModules[serviceName] = module.state.revision;
      }
    };

    // watch for mutations from the global Vuex store
    // and increment the revision number for affected StatefulService
    StatefulService.store.subscribe(mutation => {
      if (!mutation.payload.__vuexSyncIgnore) return;
      console.log('Commit vuex mutation', mutation);
      const serviceName = mutation.type.split('.')[0];
      const module = this.resolveModule(serviceName);
      module.incrementRevision();
    });
  }

  resolveModule(serviceName: string) {
    if (!this.modules[serviceName]) {
      this.modules[serviceName] = this.store.createState(serviceName, {
        revision: 0,

        incrementRevision() {
          this.revision++;
        },
      });
      this.modules[serviceName].finishInitialization();
    }
    return this.modules[serviceName];
  }
}

let modulesApp: TAppContext;

function resolveApp() {
  if (modulesApp) return modulesApp;
  const app = createApp({ VuexModule });
  const scope = app.servicesScope;
  scope.init(VuexModule);

  Object.keys(AppServices).forEach(serviceName => {
    scope.register(() => getResource(serviceName), serviceName, { shouldCallHooks: false });
  });

  modulesApp = app;
  return modulesApp;
}

/**
 * Creates a root React component with integrated Redux store
 */
export function createRoot(ChildComponent: (props: any) => JSX.Element) {
  return function ReactRoot(childProps: Object) {
    const app = resolveApp();

    return (
      <ReactModules app={app}>
        <ChildComponent {...childProps} />
      </ReactModules>
    );
  };
}
