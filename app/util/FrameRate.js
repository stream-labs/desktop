// Utility functions for working with frame rate values
export default {

  rationalToFrameInterval(rational) {
    return rational.denominator / rational.numerator;
  },

  rationalToFramesPerSecond(rational) {
    return rational.numerator / rational.denominator;
  },

  // Operates on rational values. Determines if the rate
  // is within the given range.
  rateInRange(rate, min, max) {
    let t = this.rationalToFrameInterval(rate);
    let tMax = this.rationalToFrameInterval(min);
    let tMin = this.rationalToFrameInterval(max);

    return (tMin <= t) && (tMax >= t);
  },

  // Returns common FPS values which are valid in at least
  // one of the given FPS ranges.
  simpleFPSValuesForRanges(ranges) {
    return this.commonFPSValues().filter(value => {
      return !!(_.find(ranges, range => {
        return this.rateInRange(value, range.min, range.max);
      }));
    });
  },

  // These are the same presets that the OBS UI uses
  commonFPSValues() {
    return [
      {
        name: '60',
        numerator: 60,
        denominator: 1
      },
      {
        name: '59.94',
        numerator: 60000,
        denominator: 1001
      },
      {
        name: '50',
        numerator: 50,
        denominator: 1
      },
      {
        name: '48',
        numerator: 48,
        denominator: 1
      },
      {
        name: '30',
        numerator: 30,
        denominator: 1
      },
      {
        name: '29.97',
        numerator: 30000,
        denominator: 1001
      },
      {
        name: '25',
        numerator: 25,
        denominator: 1
      },
      {
        name: '24',
        numerator: 24,
        denominator: 1
      },
      {
        name: '23.976',
        numerator: 24000,
        denominator: 1001
      }
    ];
  }

};
