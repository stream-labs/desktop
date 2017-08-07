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
}
