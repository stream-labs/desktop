import { Service } from 'services/core';
import * as obs from '../../obs-api';
import { Subject } from 'rxjs';

export interface IPermissionsStatus {
  webcamPermission: boolean;
  micPermission: boolean;
}

export class MacPermissionsService extends Service {
  permissionsUpdated = new Subject<IPermissionsStatus>();

  getPermissionsStatus(): IPermissionsStatus {
    return obs.NodeObs.GetPermissionsStatus();
  }

  requestPermissions() {
    obs.NodeObs.RequestPermissions((permissions: IPermissionsStatus) => {
      this.permissionsUpdated.next(permissions);
    });
  }
}
