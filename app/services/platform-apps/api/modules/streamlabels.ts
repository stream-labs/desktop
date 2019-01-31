import { Module, IApiContext, EApiPermissions, apiMethod } from './module';
import { StreamlabelsService } from 'services/streamlabels';
import { Inject } from 'util/injector';

/**
 * Module to interact with stream labels.
 */
export class StreamlabelsModule extends Module {
  moduleName = 'StreamLabels';
  permissions: EApiPermissions[] = [];

  @Inject() streamlabelsService: StreamlabelsService;

  /**
   * Reset the stream labels session
   *
   * @param _ctx API context
   * @returns true if the session was successfully reset
   */
  @apiMethod()
  async resetSession(_ctx: IApiContext): Promise<boolean> {
    return this.streamlabelsService.restartSession();
  }
}
