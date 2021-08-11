// Utility functions for working with frame rate values

import _ from 'lodash';

type Rational = {
  denominator: number;
  numerator: number;
};

export default {
  rationalToFrameInterval(rational: Rational) {
    return rational.denominator / rational.numerator;
  },

  rationalToFramesPerSecond(rational: Rational) {
    return rational.numerator / rational.denominator;
  },

  // Operates on rational values. Determines if the rate
  // is within the given range.
  rateInRange(rate: Rational, min: Rational, max: Rational) {
    const t = this.rationalToFrameInterval(rate);
    const tMax = this.rationalToFrameInterval(min);
    const tMin = this.rationalToFrameInterval(max);

    return tMin <= t && tMax >= t;
  },

  // Returns common FPS values which are valid in at least
  // one of the given FPS ranges.
  simpleFPSValuesForRanges(ranges: { min: Rational; max: Rational }[]) {
    return _.filter(this.commonFPSValues(), value => {
      return !!_.find(ranges, range => {
        return this.rateInRange(value, range.min, range.max);
      });
    });
  },

  // These are the same presets that the OBS UI uses
  commonFPSValues() {
    return [
      {
        name: '60',
        numerator: 60,
        denominator: 1,
      },
      {
        name: '59.94',
        numerator: 60000,
        denominator: 1001,
      },
      {
        name: '50',
        numerator: 50,
        denominator: 1,
      },
      {
        name: '48',
        numerator: 48,
        denominator: 1,
      },
      {
        name: '30',
        numerator: 30,
        denominator: 1,
      },
      {
        name: '29.97',
        numerator: 30000,
        denominator: 1001,
      },
      {
        name: '25',
        numerator: 25,
        denominator: 1,
      },
      {
        name: '24',
        numerator: 24,
        denominator: 1,
      },
      {
        name: '23.976',
        numerator: 24000,
        denominator: 1001,
      },
    ];
  },
};
