import { Service } from 'services/core';

interface IMethodLimit {
  costPerSecond: number;
  comment: string;
}

/**
 * keeps costs for expensive API methods
 */
export class ExternalApiLimitsService extends Service {
  private expensiveMethods: Dictionary<IMethodLimit> = {};

  markMethodAsExpensive(resourceName: string, method: string, costPerSecond = 1, comment = '') {
    this.expensiveMethods[`${resourceName}.${method}`] = { costPerSecond, comment };
  }

  getMethodCost(resourceName: string, method: string): IMethodLimit {
    return this.expensiveMethods[`${resourceName}.${method}`] || { costPerSecond: 0, comment: '' };
  }
}

/**
 * Decorator that applies a limit for calls per second
 * @param costPerSecond
 */
export function Expensive(costPerSecond = 1, comment = ''): PropertyDecorator {
  const externalApiLimitsService: ExternalApiLimitsService = ExternalApiLimitsService.instance;
  return function (target: Object, method: string) {
    const resourceName = target.constructor.name;
    externalApiLimitsService.markMethodAsExpensive(resourceName, method, costPerSecond, comment);
  };
}
