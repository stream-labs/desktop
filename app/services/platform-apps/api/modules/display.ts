import { Module, apiMethod, EApiPermissions, IApiContext } from './module';

export class DisplayModule extends Module {

  readonly moduleName = 'Display';
  readonly permissions: EApiPermissions[] = [];

  @apiMethod()
  create(ctx: IApiContext) {

  }

}
