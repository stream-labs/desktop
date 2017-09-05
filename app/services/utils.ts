export default class Utils {

  static applyProxy(target: Object, source: Object) {
    Object.keys(source).forEach(propName => {
      Object.defineProperty(target, propName, {
        configurable: true,
        get() { return source[propName]; }
      });
    });
  }


  static getUrlParams(): Dictionary<string> {
    const queryDict = {};
    location.search.substr(1)
      .split('&')
      .forEach(item => {
        queryDict[item.split('=')[0]] = item.split('=')[1];
      });
    return queryDict;
  }


  static isChildWindow(): boolean {
    return !!this.getUrlParams().child;
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
}
