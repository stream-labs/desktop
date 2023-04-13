import { Inject, Service, ViewHandler } from 'services/core';
import { GreenService } from './green';
import * as obs from '../../obs-api';

// /*
// Eventually this service will be in charge of storing and managing settings profiles
// once the new persistant storage system is finalized. For now it just retrieves settings
// from the backend.
// */

class SettingsManagerViews extends ViewHandler<{}> {}

export class SettingsManagerService extends Service {}
