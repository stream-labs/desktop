import URI from 'urijs';
import electron from 'electron';
import { isEqual } from 'lodash';

export const enum EBit { ZERO, ONE }

export default class Utils {

  static applyProxy(target: Object, source: Object) {
    Object.keys(source).forEach(propName => {
      Object.defineProperty(target, propName, {
        configurable: true,
        get() { return source[propName]; }
      });
    });
  }


  static getCurrentUrlParams(): Dictionary<string> {
    return this.getUrlParams(window.location.href);
  }


  static getUrlParams(url: string) {
    return URI.parseQuery(URI.parse(url).query);
  }

  static isMainWindow(): boolean {
    return !this.getCurrentUrlParams().child;
  }

  static isChildWindow(): boolean {
    return !!this.getCurrentUrlParams().child;
  }

  static isDevMode() {
    return electron.remote.process.env.NODE_ENV !== 'production';
  }

  /**
   * create an acceptable color value for obs
   */
  static rgbaToInt(r: number, g: number, b: number, a: number): number {
    let value = r;
    value |= g << 8;
    value |= b << 16;
    value |= a << 24;

    return value;
  }

  /**
   * parse obs color tor RGBA
   */
  static intToRgba(value: number) {
    return {
      r: (value & 0x000000ff),
      g: (value & 0x0000ff00) >>> 8,
      b: (value & 0x00ff0000) >>> 16,
      a: (value & 0xff000000) >>> 24
    };
  }


  static numberToBinnaryArray(num: number, size: number): EBit[] {
    const result: EBit[] = [];
    num = Math.round(num);
    size = Math.round(size);
    while (size--) {
      result.unshift(num & 1);
      num = num >> 1;
    }
    return result;
  }


  static binnaryArrayToNumber(arr: EBit[]): number {
    let result = 0;
    let ind = arr.length;
    let pow = 0;
    while (ind--) {
      result += arr[ind] * (1 << pow);
      pow++;
    }
    return result;
  }

  static getChangedParams<T>(obj: T, patch: T): Partial<T> {
    const result: Dictionary<any> = {};
    Object.keys(patch).forEach(key => {
      if (!isEqual(obj[key], patch[key])) result[key] = patch[key];
    });
    return result as Partial<T>;
  }
}
