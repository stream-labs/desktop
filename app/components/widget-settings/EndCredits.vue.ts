import Vue from 'vue';
import URI from 'urijs';
import { defer } from 'lodash';
import { PersistentStatefulService } from '../../services/persistent-stateful-service';
import { Inject } from '../../util/injector';
import { handleErrors, authorizedHeaders } from 'util/requests';
import { mutation } from '../../services/stateful-service';
import electron from 'electron';
import { HostsService } from '../../services/hosts';
import {
  getPlatformService,
  IPlatformAuth,
  TPlatform,
  IPlatformService
} from '../../services/platforms';
import { CustomizationService } from '../../services/customization';
import Raven from 'raven-js';
import { AppService } from 'services/app';
import { SceneCollectionsService } from 'services/scene-collections';
import { Subject } from 'rxjs/Subject';
import Util from 'services/utils';

export default class AlertBox extends Vue {
  @Inject() hostsService: HostsService;
  @Inject() customizationService: CustomizationService;
  @Inject() appService: AppService;
  @Inject() sceneCollectionsService: SceneCollectionsService;

  mounted() {
    this.getSettings();
  }

  getSettings() {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/widget/endcredits`;

    return fetch(url);
  }
}
