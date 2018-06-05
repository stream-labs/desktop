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
    WListInput,
  }
})
export default class BitGoal extends Vue {
  @Inject() customizationService: CustomizationService;
  @Inject() widgetSettingsService: WidgetSettingsService;
  @Inject() windowsService: WindowsService;

  mounted() {
    this.widgetSettingsService.getBitGoalSettings().then(settings => {
      this.bitGoalData = settings;
      if (!this.bitGoalData.goal.title) {
        this.bitGoalData.goal = {
          title: '',
          goal_amount: null,
          manual_goal_amount: null,
          ends_at: ''
        };
      }

      if (this.bitGoalData.goal.title) {
        this.has_goal = true;
      }

      // this.backgroundColorData.value = this.bitGoalData.settings.background_color;
      // this.barColorData.value = this.bitGoalData.settings.bar_color;
      // this.textColorData = this.bitGoalData.settings.text_color;
      // this.barTextColorData.value = this.bitGoalData.settings.bar_text_color;
      // this.barBackgroundColorData.value = this.bitGoalData.settings.bar_bg_color;
      this.fontFamilyData.value = this.bitGoalData.settings.font;
      this.layout.value = this.bitGoalData.settings.layout;
      this.barThicknessData.value = this.bitGoalData.settings.bar_thickness;
    });
  }

  get widgetUrl() {
    return this.widgetSettingsService.getWidgetUrl('BitGoal');
  }

  bitGoalData: IBitGoalSettings = null;

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

  backgroundColorData = {
    description: 'Background Color',
    value: ''
  };

  textColorData = '';

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
    value: '',
  };

  // @Watch('bitGoalData')
  // update() {
  //   this.updateEditor();
  // }

  // updateEditor() {

  // }

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

  onGoalSave(bitGoalData: IBitGoalSettings) {
    this.widgetSettingsService.postBitGoal(bitGoalData)
      .then(response => { this.bitGoalData.goal = response.goal; });
    this.has_goal = true;
  }

  onSettingsSave(bitGoalData: IBitGoalSettings) {
    this.widgetSettingsService.postBitGoalSettings(bitGoalData)
      .then(response => { this.bitGoalData.settings = response.settings; });
  }

  cancel() {
    this.windowsService.closeChildWindow();
  }
}
