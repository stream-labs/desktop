import { Service } from '../services/service';

/**
 * Service with InitAfter decorator will be created after the observable
 * service initialization. This allows observable service to know nothing about observer.
 * In this case observer-service is like a "plugin" for observable service.
 */
// tslint:disable-next-line:function-name
export function InitAfter(observableServiceName: string) {
  return function(target: typeof Service) {
    const observeList = ObserveList.instance;
    observeList.add({ observableServiceName, observerServiceName: target.name });
  };
}

interface IObservation {
  observerServiceName: string;
  observableServiceName: string;
}

export class ObserveList extends Service {
  observations: {
    observerServiceName: string;
    observableServiceName: string;
  }[] = [];

  add(observation: IObservation) {
    this.observations.push(observation);
  }
}
