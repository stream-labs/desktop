const __injectMap__ = new Map();

export function __setup(obj: { [key: string]: any }): void {
  __injectMap__.clear();
  for (const [key, value] of Object.entries(obj)) {
    __injectMap__.set(key, value);
  }
}

export function Inject(serviceName?: string) {
  return function(target: Object, key: string) {
    Object.defineProperty(target, key, {
      get() {
        const name = serviceName || key.charAt(0).toUpperCase() + key.slice(1);
        if (!__injectMap__.has(name)) throw new Error(`no mock defined for "${name}"`);
        return __injectMap__.get(name);
      },
    });
  };
}
