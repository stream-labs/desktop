/**
 * Travers class methods and props
 */
export function traverseClassInstance<T extends object>(
  instance: T,
  cb: (propName: string, descriptor: PropertyDescriptor) => unknown,
) {
  let entity = instance;
  const prototypes = [];
  while (entity.constructor.name !== 'Object') {
    prototypes.push(entity);
    entity = Object.getPrototypeOf(entity);
  }

  const alreadyTraversed: Record<string, boolean> = {};

  prototypes.forEach(proto => {
    Object.getOwnPropertyNames(proto).forEach(propName => {
      if (propName in alreadyTraversed) return;
      alreadyTraversed[propName] = true;
      const descriptor = Object.getOwnPropertyDescriptor(proto, propName);
      if (!descriptor) return;
      cb(propName, descriptor);
    });
  });
}
