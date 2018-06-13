import Vue from 'vue';
import { Inject } from '../../util/injector';
import { CustomizationService } from '../../services/customization';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ModalLayout from 'components/ModalLayout.vue';
import WColorInput from '../shared/widget_inputs/WColorInput.vue';
import WSlider from '../shared/widget_inputs/WSlider.vue';
import WFontFamily from '../shared/widget_inputs/WFontFamily.vue';
import WFontSize from '../shared/widget_inputs/WFontSize.vue';
import WCodeEditor from '../shared/widget_inputs/WCodeEditor.vue';
import WListInput from '../shared/widget_inputs/WListInput.vue';
import { IListInput, IFormInput } from '../shared/forms/Input';
import {
  WidgetSettingsService,
  IChatBoxSettings
} from '../../services/widget-settings/widget-settings';
import VeeValidate from 'vee-validate';
import Tabs from 'vue-tabs-component';
import request from 'request';
import { WindowsService } from 'services/windows';
import { Response } from 'aws-sdk';

Vue.use(VeeValidate);
Vue.use(Tabs);

@Component({
  components: {
    WColorInput,
    WFontFamily,
    WFontSize,
    WCodeEditor,
    ModalLayout,
    WSlider,
    WListInput,
  }
})
export default class BitGoal extends Vue {
  @Inject() customizationService: CustomizationService;
  @Inject() widgetSettingsService: WidgetSettingsService;
  @Inject() windowsService: WindowsService;

  mounted() {

  }

  get widgetUrl() {
    return this.widgetSettingsService.getWidgetUrl('ChatBox');
  }

  widgetData: IChatBoxSettings = null;

  cancel() {
    this.windowsService.closeChildWindow();
  }
}
