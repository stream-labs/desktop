import { useOnCreate } from '../hooks';

let nextComponentId = 1;

/**
 * Returns an unique component id
 * If DEBUG=true then the componentId includes a component name
 */
export function useComponentId() {
  const DEBUG = true;
  return useOnCreate(() => {
    return DEBUG ? `${nextComponentId++}_${getComponentName()}` : `${nextComponentId++}`;
  });
}

/**
 * Get component name from the callstack
 * Use for debugging only
 */
function getComponentName(): string {
  try {
    throw new Error();
  } catch (e) {
    return e.stack.split('\n')[10].split('at ')[1].split('(')[0].trim();
  }
}
