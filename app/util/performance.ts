import uuid from 'uuid/v4';

/**
 * Used to simply measure and log the duration between 2 points in code
 */
export class Measure {
  readonly id: string;

  constructor(public name: string) {
    this.id = uuid();
    this.start();
  }

  get startMark() {
    return `${this.id}-start`;
  }

  get endMark() {
    return `${this.id}-end`;
  }

  start() {
    performance.mark(this.startMark);
  }

  end() {
    performance.mark(this.endMark);
    performance.measure(this.id, this.startMark, this.endMark);
    const duration = performance.getEntriesByName(this.id)[0].duration;

    console.log('====== Performance Measure ======');
    console.log(`Name: ${this.name}`);
    console.log(`Duration: ${duration.toFixed(2)}ms`);
    console.log('=================================');
  }
}

/**
 * Decorator to wrap a named method and log its execution time
 */
export function measure() {
  return (target: unknown, methodName: string, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      const meas = new Measure(methodName);
      original.apply(this, args);
      meas.end();
    };

    return descriptor;
  };
}

/**
 * Used to wrap a piece of code in a measurement
 * @param name The name of the measurement
 * @param func The execution function
 */
export function wrapMeasure(name: string, func: Function) {
  const meas = new Measure(name);
  const result = func();
  meas.end();
  return result;
}
