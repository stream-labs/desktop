import Vue from 'vue';
import { Inject } from '../../util/injector';
import { CustomizationService } from '../../services/customization';
import { AppService } from 'services/app';
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
  IBitGoalSettings
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
    WListInput
  }
})
export default class BitGoal extends Vue {
  @Inject() customizationService: CustomizationService;
  @Inject() appService: AppService;
  @Inject() widgetSettingsService: WidgetSettingsService;
  @Inject() windowsService: WindowsService;

  mounted() {
    this.widgetSettingsService.getBitGoalSettings().then(settings => {
      this.widgetData = settings;
      if (!this.widgetData.goal.title) {
        this.widgetData.goal = {
          title: '',
          goal_amount: null,
          manual_goal_amount: null,
          ends_at: ''
        };
      }
      this.barColorData.value = this.widgetData.settings.bar_color;
      this.textColorData.value = this.widgetData.settings.text_color;
      this.barTextColorData.value = this.widgetData.settings.bar_text_color;
      this.barBackgroundColorData.value = this.widgetData.settings.bar_bg_color;
      this.fontFamilyData.value = this.widgetData.settings.font;
      this.layout.value = this.widgetData.settings.layout;

      if (this.widgetData.goal.title) {
        this.has_goal = true;
      }
    });
  }

  widgetData: IBitGoalSettings = null;
  barThickness: number;

  layout: IListInput<string> = {
    name: 'layout',
    description: 'Layout',
    value: '',
    options: [
      { description: 'Standard', value: 'standard' },
      { description: 'Condensed', value: 'condensed' }
    ]
  };

  textColorData = {
    description: 'Text Color',
    value: ''
  };

  barTextColorData = {
    description: 'Bar Text Color',
    value: ''
  };

  barColorData = {
    description: 'Bar Color',
    value: ''
  };

  barBackgroundColorData = {
    description: 'Bar Background Color',
    value: ''
  };

  fontFamilyData = {
    description: 'Font Family',
    value: ''
  };

  barThicknessData = {
    description: 'Bar Thickness',
    value: this.barThickness
  };


  get widgetUrl() {
    return this.widgetSettingsService.getWidgetUrl('BitGoal');
  }

  @Watch('widgetData')
  update() {
    this.updateEditor();
  }

  updateEditor() {

  }

  resetCustom() {
    this.widgetSettingsService.defaultBitGoalSettings.settings.custom_html
      = this.widgetSettingsService.defaultBitGoalSettings.custom_defaults.html;
    this.widgetSettingsService.defaultBitGoalSettings.settings.custom_css
      = this.widgetSettingsService.defaultBitGoalSettings.custom_defaults.css;
    this.widgetSettingsService.defaultBitGoalSettings.settings.custom_js
      = this.widgetSettingsService.defaultBitGoalSettings.custom_defaults.js;
  }

  has_goal = false;

  onEndGoal() {
    this.has_goal = false;
    this.widgetSettingsService.deleteBitGoal();
  }

  onGoalSave(widgetData: IBitGoalSettings) {
    console.log(widgetData);
    this.widgetSettingsService.postBitGoal(widgetData).then(response => { this.widgetData.goal = response.goal; });
    this.has_goal = true;
  }

  onSettingsSave() {
    this.widgetSettingsService.postBitGoalSettings(this.widgetData);
  }

  cancel() {
    this.windowsService.closeChildWindow();
  }
}
