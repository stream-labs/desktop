export function parse(config: string, nodeTypes: Dictionary<any>) {
  return JSON.parse(config, (key, value) => {
    if ((typeof value === 'object') && (value !== null) && value.nodeType) {
      const instance = new nodeTypes[value.nodeType]();

      instance.fromJSON(value);
      return instance;
    } else {
      return value;
    }
  });
}
