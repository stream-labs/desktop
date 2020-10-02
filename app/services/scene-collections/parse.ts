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
      const nodeClass = nodeTypes[value.nodeType];

      if (nodeClass) {
        const instance = new nodeClass();

        instance.fromJSON(value);
        return instance;
      } else {
        console.warn(`Found unrecognized node in JSON: ${value.nodeType}`);
      }
    }

    return value;
  });
}
