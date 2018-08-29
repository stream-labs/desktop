import { Module, EApiPermissions, apiMethod } from './module';

export class ExampleModule extends Module {

  moduleName = 'Example';
  permissions = [EApiPermissions.Example]

  @apiMethod()
  async exampleApiMethod(foo: string) {
    return `You said: ${foo}`;
  }

}
