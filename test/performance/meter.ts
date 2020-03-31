type TMeterEvent = 'mainWindowShow' | 'sceneCollectionLoad' | 'CPU' | 'memory' | 'bundleSize';

const units: { [key in TMeterEvent]: string } = {
  mainWindowShow: 'ms',
  sceneCollectionLoad: 'ms',
  CPU: 'percent',
  memory: 'bite',
  bundleSize: 'bite',
};

/**
 * measures time between events
 */
class Meter {
  /**
   * keeps starting time of events
   */
  private pendingEvents: Partial<{ [key in TMeterEvent]: number }>;

  /**
   * keeps durations of events
   */
  private recordedEvents: Partial<{ [key in TMeterEvent]: { units: string; values: number[] } }>;

  constructor() {
    this.reset();
  }

  reset() {
    this.pendingEvents = {};
    this.recordedEvents = {};
  }

  getRecordedEvents() {
    return this.recordedEvents;
  }

  startMeasure(eventName: string) {
    if (this.pendingEvents[eventName]) {
      throw new Error(`Measurement of "${eventName}" has been already started`);
    }
    this.pendingEvents[eventName] = Date.now();
  }

  stopMeasure(eventName: string) {
    const eventStartTime = this.pendingEvents[eventName];

    if (!eventStartTime) {
      throw new Error(
        `Try to stop measure the event "${eventName}" but the measurement has not been started `,
      );
    }

    const duration = Date.now() - eventStartTime;
    delete this.pendingEvents[eventName];
    this.addMeasurement(eventName, duration);
  }

  addMeasurement(eventName: string, duration: number) {
    if (!this.recordedEvents[eventName]) {
      this.recordedEvents[eventName] = { units: units[eventName], values: [] };
    }
    this.recordedEvents[eventName].values.push(duration);
  }

  printResults() {
    Object.keys(this.recordedEvents).forEach(eventName => {
      const values = this.recordedEvents[eventName].values;
      const average = values.reduce((v1: number, v2: number) => v1 + v2) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const dispersion = max - min;
      console.log(`-------${eventName}`);
      console.log('records:', values);
      console.log('average:', average);
      console.log('min:', min);
      console.log('max:', max);
      console.log('dispersion:', dispersion);
    });
  }
}

let meter: Meter;

/**
 * returns already created instance of Meter if exists or creates a new one
 */
export function getMeter() {
  if (meter) return meter;
  meter = new Meter();
  return meter;
}
