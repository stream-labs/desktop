import { Module, EApiPermissions, apiMethod, IApiContext } from './module';
import url from 'url';
import remote from '@electron/remote';

export class ExternalModule extends Module {
  readonly moduleName = 'External';
  readonly permissions = [EApiPermissions.ExternalLinks];

  @apiMethod()
  openExternalLink(ctx: IApiContext, urlStr: string) {
    const parsed = url.parse(urlStr);
    const allowedProtocols = ['http:', 'https:'];

    if (!allowedProtocols.includes(parsed.protocol)) {
      throw new Error(
        `Protocol ${parsed.protocol} is not allowed.  Must be one of ${allowedProtocols}`,
      );
    }

    remote.shell.openExternal(urlStr);
  }
}
