import Vue from 'vue';
import { Inject } from '../../util/injector';
import { Component } from 'vue-property-decorator';
import { authorizedHeaders } from 'util/requests';
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
import { AppService } from 'services/app';
import { UserService } from 'services/user';
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
  @Inject() userService: UserService;
}
