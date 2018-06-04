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
  IDonationGoalSettings
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
export default class DonationGoal extends Vue {
  @Inject() customizationService: CustomizationService;
  @Inject() widgetSettingsService: WidgetSettingsService;
  @Inject() windowsService: WindowsService;

  mounted() {
    this.widgetSettingsService.getDonationGoalSettings().then(settings => {
      this.widgetData = settings;
      if (!this.widgetData.goal.title) {
        this.widgetData.goal = {
          title: '',
          goal_amount: null,
          manual_goal_amount: null,
          ends_at: ''
        };
      }

      if (this.widgetData.goal.title) {
        this.has_goal = true;
      }

      this.backgroundColorData.value = this.widgetData.settings.background_color;
      this.barColorData.value = this.widgetData.settings.bar_color;
      this.textColorData.value = this.widgetData.settings.text_color;
      this.barTextColorData.value = this.widgetData.settings.bar_text_color;
      this.barBackgroundColorData.value = this.widgetData.settings.bar_bg_color;
      this.fontFamilyData.value = this.widgetData.settings.font;
      this.layout.value = this.widgetData.settings.layout;
      this.barThicknessData.value = this.widgetData.settings.bar_thickness;
    });
  }

  get widgetUrl() {
    return this.widgetSettingsService.getWidgetUrl('DonationGoal');
  }

  widgetData: IDonationGoalSettings = null;

  barThickness: number;

  backgroundColorData = {
    description: 'Background Color',
    value: ''
  };

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
    value: ''
  };

  // @Watch('widgetData')
  // update() {
  //   this.updateEditor();
  // }

  // updateEditor() {

  // }

  resetCustom() {
    this.widgetSettingsService.defaultDonationGoalSettings.settings.custom_html
      = this.widgetSettingsService.defaultDonationGoalSettings.custom_defaults.html;
    this.widgetSettingsService.defaultDonationGoalSettings.settings.custom_css
      = this.widgetSettingsService.defaultDonationGoalSettings.custom_defaults.css;
    this.widgetSettingsService.defaultDonationGoalSettings.settings.custom_js
      = this.widgetSettingsService.defaultDonationGoalSettings.custom_defaults.js;
  }

  has_goal = false;

  onEndGoal() {
    this.has_goal = false;
    this.widgetSettingsService.deleteDonationGoal();
  }

  onGoalSave(widgetData: IDonationGoalSettings) {
    this.widgetSettingsService.postDonationGoal(widgetData)
      .then(response => { this.widgetData.goal = response.goal; });
    this.has_goal = true;
  }

  onSettingsSave(widgetData: IDonationGoalSettings) {
    this.widgetSettingsService.postDonationGoalSettings(widgetData)
      .then(response => { this.widgetData.settings = response.settings; });
  }

  cancel() {
    this.windowsService.closeChildWindow();
  }
}
