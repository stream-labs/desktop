import { Module, EApiPermissions, apiMethod, IApiContext } from './module';
import electron from 'electron';
import url from 'url';

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

    electron.remote.shell.openExternal(urlStr);
  }
}
