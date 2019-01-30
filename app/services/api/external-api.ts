import { RpcApi } from './rpc-api';
import { Inject } from 'util/injector';
import { InternalApiService } from './internal-api';
import * as apiModules from './external-api/modules';
import { Service } from 'services/service';

/**
 * External API for usage in remote-control, Streamdeck and other 3rd-party services
 *
 */
export class ExternalApiService extends RpcApi {
  @Inject() private internalApiService: InternalApiService;
  private modules = { ...apiModules };
  private instances: Dictionary<Service> = {};

  init() {
    // initialize singletons
    Object.keys(this.modules).forEach(moduleName => {
      const module = this.modules[moduleName];
      if (module.singleton) this.instances[moduleName] = module.singleton;
    });
  }

  getResource(resourceId: string) {
    // if resource is singleton return the singleton instance
    if (this.instances[resourceId]) return this.instances[resourceId];

    // resource is not singleton
    // take serialized constructor arguments from `resourceId` string and construct a new instance
    const helperName = resourceId.split('[')[0];
    const constructorArgsStr = resourceId.substr(helperName.length);
    const constructorArgs = constructorArgsStr ? JSON.parse(constructorArgsStr) : void 0;
    const Helper = this.modules[name];
    if (Helper) {
      return new (Helper as any)(...constructorArgs);
    }

    // it looks like this resource has been not found in external API
    // try to fall back it to InternalApiService
    return this.internalApiService.getResource(resourceId);
  }
}
