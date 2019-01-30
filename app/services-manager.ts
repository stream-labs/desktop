import 'reflect-metadata';
import { Service } from 'services/service';
import Utils from './services/utils';
import { ObserveList } from './util/service-observer';
import { StatefulService } from './services/stateful-service';

import * as appServices from './app-services';
import { ChildWindowApiClient } from './services/api/child-window-api-client';

export class ServicesManager extends Service {
  /**
   * list of used application services
   */
  services: Dictionary<any> = {
    ...appServices,
  };

  private instances: Dictionary<Service> = {};
  private childWindowApiClient: ChildWindowApiClient;

  init() {
    // this helps to debug services from the console
    if (Utils.isDevMode()) {
      window['sm'] = this;
    }

    if (!Utils.isMainWindow()) {
      this.childWindowApiClient = new ChildWindowApiClient();
      Service.setupProxy(service => this.childWindowApiClient.applyIpcProxy(service));
      Service.setupInitFunction(service => {
        return true;
      });
      return;
    }
    Service.serviceAfterInit.subscribe(service => this.initObservers(service));
  }

  private initObservers(observableService: Service): Service[] {
    const observeList: ObserveList = ObserveList.instance;
    const items = observeList.observations.filter(item => {
      return item.observableServiceName === observableService.serviceName;
    });
    return items.map(item => this.getService(item.observerServiceName).instance);
  }

  listenMessages() {
    this.childWindowApiClient.listenMessages();
  }

  getService(serviceName: string) {
    return this.services[serviceName];
  }

  getStatefulServicesAndMutators(): Dictionary<typeof StatefulService> {
    const statefulServices = {};
    Object.keys(this.services).forEach(serviceName => {
      const ServiceClass = this.services[serviceName];
      const isStatefulService = ServiceClass['initialState'];
      const isMutator = ServiceClass.prototype.mutations;
      if (!isStatefulService && !isMutator) return;
      statefulServices[serviceName] = this.services[serviceName];
    });
    return statefulServices;
  }

  /**
   * returns Service instance or ServiceHelper instance
   * @example
   * sourcesService = getResource('SourcesService')
   *
   * @example
   * source = getResource('Source[12]')
   */
  getResource(resourceId: string) {
    if (resourceId === 'ServicesManager') {
      return this;
    }

    if (this.services[resourceId]) {
      return this.getInstance(resourceId) || this.initService(resourceId);
    }

    const helperName = resourceId.split('[')[0];
    const constructorArgsStr = resourceId.substr(helperName.length);
    const constructorArgs = constructorArgsStr ? JSON.parse(constructorArgsStr) : void 0;
    return this.getHelper(helperName, constructorArgs);
  }

  /**
   * the information about resource scheme helps to improve performance for API clients
   * this is undocumented feature is mainly for our API client that we're using in tests
   */
  getResourceScheme(resourceId: string): Dictionary<string> {
    const resource = this.getResource(resourceId);
    if (!resource) {
      return null;
    }
    const resourceScheme = {};

    // collect resource keys from the whole prototype chain
    const keys: string[] = [];
    let proto = resource;
    do {
      keys.push(...Object.keys(proto));
      proto = Object.getPrototypeOf(proto);
    } while (proto.constructor.name !== 'Object');

    keys.forEach(key => {
      resourceScheme[key] = typeof resource[key];
    });

    return resourceScheme;
  }

  private getHelper(name: string, constructorArgs: any[]) {
    const Helper = this.services[name];
    if (!Helper) return null;
    return new (Helper as any)(...constructorArgs);
  }

  private initService(serviceName: string): Service {
    const ServiceClass = this.services[serviceName];
    if (!ServiceClass) throw `unknown service: ${serviceName}`;
    if (this.instances[serviceName]) return;
    this.instances[serviceName] = ServiceClass.instance;
    return ServiceClass.instance;
  }

  private getInstance(serviceName: string): Service {
    return this.instances[serviceName];
  }
}
