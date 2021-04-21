import { Service } from './service';

/**
 * Eagerly initialize the service after specified service initialization
 */
// tslint:disable-next-line:function-name
export function InitAfter(observableServiceName: string) {
  return function (target: typeof Service) {
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
