import Utils from 'services/utils';
import path from 'path';
import electron from 'electron';

/**
 * Returns a fully qualified path to an asset in the shared-resources
 * folder. This path can be used by both the frontend and backend and
 * works in development and in production.
 */
export function getSharedResource(resource: string) {
  if (Utils.isDevMode()) {
    return path.resolve(electron.remote.app.getAppPath(), 'shared-resources', resource);
  }

  return path.resolve(electron.remote.app.getAppPath(), '../../shared-resources', resource);
}
