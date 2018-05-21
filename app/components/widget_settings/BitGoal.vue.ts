import Vue from 'vue';
import { Inject } from '../../util/injector';
import { CustomizationService } from '../../services/customization';
import { AppService } from 'services/app';
import { Component } from 'vue-property-decorator';
import ModalLayout from 'components/ModalLayout.vue';
import WColorInput from '../shared/widget_inputs/WColorInput.vue';
import WSlider from '../shared/widget_inputs/WSlider.vue';
import WFontFamily from '../shared/widget_inputs/WFontFamily.vue';
import WFontSize from '../shared/widget_inputs/WFontSize.vue';
import WCodeEditor from '../shared/widget_inputs/WCodeEditor.vue';
import WListInput from '../shared/widget_inputs/WListInput.vue';
import { IListInput, IFormInput } from '../shared/forms/Input';
import { WidgetSettingsService } from '../../services/widget-settings/widget-settings';
import VeeValidate from 'vee-validate';
import Tabs from 'vue-tabs-component';

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

  mounted() {
    this.stringToInt();

    console.log(parseInt(this.widgetData.settings.bar_thickness, 10));
  }

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
    value: this.widgetData.settings.background_color
  };

  textColorData = {
    description: 'Text Color',
    value: this.widgetData.settings.text_color,
  };

  barTextColorData = {
    description: 'Bar Text Color',
    value: this.widgetData.settings.bar_text_color,
  };

  barColorData = {
    description: 'Bar Color',
    value: this.widgetData.settings.bar_color,
  };

  barBackgroundColorData = {
    description: 'Bar Background Color',
    value: this.widgetData.settings.bar_bg_color,
  };

  fontFamilyData = {
    description: 'Font Family',
    value: this.widgetData.settings.font
  };

  setLayout() {
    this.layout.value;
  }

  get widgetUrl() {
    return this.widgetSettingsService.getWidgetUrl('BitGoal');
  }

  get widgetData() {
    return this.widgetSettingsService.getBitGoalSettings();
  }

  barThickness: number;

  stringToInt() {
    const barThickness = parseInt(this.widgetData.settings.bar_thickness, 10);

    return barThickness;
  }

  barThicknessData = {
    description: 'Bar Thickness',
    value: this.barThickness
  };

  // validate() {
  //   return this.$validator.validateAll().then(() => {
  //     if (this.errors.any()) {
  //       throw 'validation error';
  //     }

  //     return true;
  //   });
  // }

  // onGoalSave() {
  //   const $vm = this;

  //   this.validate().then(() => {
  //     this.post('widget/bitgoal', this.data).then((response) => {
  //       $vm.goal = response.goal;
  //       // $vm.settings = response.settings;
  //       $vm.success($vm.$t('Goal saved'));
  //     });
  //   });
  // }

  // onSettingsSave() {
  //   const $vm = this;

  //   this.post('widget/bitgoal/settings', this.settings).then((response) => {
  //     $vm.success($vm.$t('Settings saved'));
  //   });
  // }

  // onGoalSave() {
  //   this.validate().then(() => {
  //     this.post('https://streamlabs/.com/api/v5/widget/bitgoal', this.data).then((response) => {
  //       this.goal = response.goal;
  //       // this.settings = response.settings;
  //       this.success(this.$t('Goal saved'));
  //     });
  //   });
  // }

  // onSettingsSave() {
  //   this.post('https://streamlabs/.com/api/v5/widget/bitgoal/settings', this.settings).then((response) => {
  //     this.success(this.$t('Settings saved'));
  //   });
  // }

  // resetCustom() {
  //   this.WidgetSettingsService.custom_html = this.bitGoalDefaultHTML;
  //   this.WidgetSettingsService.custom_css = this.bitGoalDefaultCSS;
  //   this.WidgetSettingsService.custom_js = this.bitGoalDefaultJS;
  // }

  // Will be function to save settings and close window
  submit() {

  }

  // Will be function to close window
  cancel() {

  }
}
