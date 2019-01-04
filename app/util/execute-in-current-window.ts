import 'reflect-metadata';

/**
 * use this decorator to execute service method in the current window
 */
// tslint:disable-next-line:function-name
export default function ExecuteInCurrentWindow() {
  return function(target: any, methodName: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata('executeInCurrentWindow', true, target, methodName);
  };
}
