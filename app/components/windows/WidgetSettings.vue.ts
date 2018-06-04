import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import ModalLayout from 'components/ModalLayout.vue';
import { WindowsService } from 'services/windows';
import windowMixin from 'components/mixins/window';
import { SourcesService, TSourceType, TPropertiesManager } from 'services/sources';
import { ScenesService } from 'services/scenes';
import { UserService } from 'services/user';
import { WidgetsService, WidgetType } from 'services/widgets';
// Widget setting components
import BitGoal from 'components/widget_settings/BitGoal.vue';
import DonationGoal from 'components/widget_settings/DonationGoal.vue';

type TInspectableSource = TSourceType | WidgetType | 'streamlabel';

interface ISelectSourceOptions {
  propertiesManager?: TPropertiesManager;
  widgetType?: WidgetType;
}

@Component({
  components: {
    ModalLayout,
    BitGoal,
    DonationGoal
  },
  mixins: [windowMixin],
})
export default class SourcesShowcase extends Vue {
  @Inject() sourcesService: SourcesService;
  @Inject() userService: UserService;
  @Inject() widgetsService: WidgetsService;
  @Inject() scenesService: ScenesService;
  @Inject() windowsService: WindowsService;


}
