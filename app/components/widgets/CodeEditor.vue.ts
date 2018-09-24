import Vue from 'vue';
import { cloneDeep } from 'lodash';
import { Component, Prop } from 'vue-property-decorator';
import { codemirror } from 'vue-codemirror';
import { CodeInput, BoolInput } from 'components/shared/inputs/inputs';
import { IWidgetData, WidgetSettingsService } from 'services/widgets';
import { Inject } from '../../util/injector';
import { WidgetsService } from 'services/widgets';
import { $t } from 'services/i18n/index';
import { IInputMetadata } from 'components/shared/inputs';


@Component({
  components: {
    CodeInput,
    BoolInput
  }
})
export default class CodeEditor extends Vue {

  @Inject() private widgetsService: WidgetsService;

  @Prop()
  metadata: IInputMetadata;

  @Prop()
  value: IWidgetData;

  editorInputValue = this.value.settings['custom_' + this.metadata.type];

  private initialInputValue = this.editorInputValue;
  private serverInputValue = this.editorInputValue;

  isLoading = false;

  private settingsService: WidgetSettingsService<any>;

  created() {
    this.settingsService = this.widgetsService.getWidgetSettingsService(this.value.type);
  }

  get hasChanges() {
    return (this.serverInputValue !== this.editorInputValue);
  }

  get canSave() {
    return this.hasChanges && !this.isLoading;
  }

  get hasDefaults() {
    return !!this.value.custom_defaults;
  }

  async save() {
    if (!this.canSave) return;
    this.isLoading = true;

    const type = this.metadata.type;
    const newData = cloneDeep(this.value);
    newData.settings['custom_' + type] = this.editorInputValue;
    try {
      await this.settingsService.saveSettings(newData.settings);
    } catch (e) {
      alert($t('Something went wrong'));
      this.isLoading = false;
      return;
    }

    this.serverInputValue = this.editorInputValue;
    this.isLoading = false;
  }

  discardChanges() {
    const type = this.metadata.type;
    const newData = cloneDeep(this.value);
    newData.settings['custom_' + type] = this.initialInputValue;
    this.editorInputValue = newData.settings['custom_' + this.metadata.type];
  }

  restoreDefaults() {
    if (!this.hasDefaults) return;
    const type = this.metadata.type;
    const newData = cloneDeep(this.value);
    newData.settings['custom_' + type] = this.value.custom_defaults[type];
  }

}
