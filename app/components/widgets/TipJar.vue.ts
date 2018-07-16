import Vue from 'vue';
import URI from 'urijs';
import { defer } from 'lodash';
import { PersistentStatefulService } from '../../services/persistent-stateful-service';
import { Inject } from '../../util/injector';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { handleErrors, authorizedHeaders } from 'util/requests';
import { mutation } from '../../services/stateful-service';
import electron from 'electron';
import { HostsService } from '../../services/hosts';
import WidgetWindow from 'components/windows/WidgetWindow.vue';
import WidgetSettings from './WidgetSettings.vue';
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
import {
  TipJarService,
  ITipJarData
} from 'services/widget-settings/tip-jar';
import * as comps from 'components/shared/widget-inputs';
import WFormGroup from 'components/shared/widget-inputs/WFormGroup.vue';

@Component({
  components: {
    WidgetWindow,
    WFormGroup,
    ...comps
  }
})
export default class TipJar extends WidgetSettings<ITipJarData, TipJarService> {
  @Inject() hostsService: HostsService;
  @Inject() customizationService: CustomizationService;
  @Inject() appService: AppService;
  @Inject() sceneCollectionsService: SceneCollectionsService;

  mounted() {
    this.getSettings();
  }

  getSettings() {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/widget/tipjar`;

    return fetch(url);
  }
}
