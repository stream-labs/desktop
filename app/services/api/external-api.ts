import { RpcApi } from './rpc-api';
import { Inject } from 'util/injector';
import { InternalApiService } from './internal-api';
import * as apiResources from './external-api/resources';
import { Service } from 'services/service';

export interface Serializable {
  // really wish to have something like
  // `type TSerializable = number | string | boolean | null | Dictionary<TSerializable> | Array<TSerializable>;`
  // instead of `any` here
  getModel(): any;
}

export function Singleton() {
  return function(Klass: any) {
    Klass.isSingleton = true;
  };
}

/**
 * External API for usage outside of SLOBS application
 * for stuff like remote-control, StreamDeck and other 3rd-party services
 * This API is documented and must not have breaking changes
 */
export class ExternalApiService extends RpcApi {
  @Inject() private internalApiService: InternalApiService;
  private resources = { ...apiResources };
  private instances: Dictionary<Service> = {};

  init() {
    // initialize singletons
    Object.keys(this.resources).forEach(resourceName => {
      const Resource = this.resources[resourceName];
      if (Resource.isSingleton) this.instances[resourceName] = new Resource();
    });
  }

  getResource(resourceId: string) {
    // if resource is singleton return the singleton instance
    if (this.instances[resourceId]) return this.instances[resourceId];

    // if resource is not singleton
    // take serialized constructor arguments from `resourceId` string and construct a new instance
    const helperName = resourceId.split('[')[0];
    const constructorArgsStr = resourceId.substr(helperName.length);
    const constructorArgs = constructorArgsStr ? JSON.parse(constructorArgsStr) : void 0;
    const Helper = this.resources[helperName];
    if (Helper) {
      return new (Helper as any)(...constructorArgs);
    }

    // it looks like this resource has been not found in the external API
    // try to fallback to InternalApiService
    return this.internalApiService.getResource(resourceId);
  }
}
