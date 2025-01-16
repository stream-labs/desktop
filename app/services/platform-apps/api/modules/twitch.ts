import { Inject } from 'services/core';
import { EApiPermissions, IApiContext, Module, apiMethod } from './module';
import { TwitchService, UserService } from 'app-services';

export class TwitchModule extends Module {
  moduleName = 'Twitch';
  permissions: EApiPermissions[] = [];

  // This module allows use of our local twitch credentials, so only
  // allow streamlabs internal apps to access it.
  requiresHighlyPrivileged = true;

  @Inject() twitchService: TwitchService;
  @Inject() userService: UserService;

  @apiMethod()
  hasSendChatScope() {
    return this.twitchService.state.hasChatWritePermission;
  }

  @apiMethod()
  async sendChatMessage(ctx: IApiContext, msg: string) {
    await this.twitchService.sendChatMessage(msg);
  }

  @apiMethod()
  requestNewScopes() {
    this.userService.startAuth('twitch', 'external', false, true);
  }
}