// These nodes will not be created as nodes
const deprecatedNodes = ['FiltersNode'];

export function parse(config: string, nodeTypes: Dictionary<any>) {
  return JSON.parse(config, (key, value) => {
    if (
      typeof value === 'object' &&
      value !== null &&
      value.nodeType &&
      !deprecatedNodes.includes(value.nodeType)
    ) {
      const instance = new nodeTypes[value.nodeType]();

      instance.fromJSON(value);
      return instance;
    }

    return value;
  });
}
