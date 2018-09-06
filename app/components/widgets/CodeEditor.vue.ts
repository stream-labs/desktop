import Vue from 'vue';
import { cloneDeep } from 'lodash';
import { Component, Prop } from 'vue-property-decorator';
import { codemirror } from 'vue-codemirror';
import { CodeInput, BoolInput } from 'components/shared/inputs/inputs';
import { IWidgetData, WidgetSettingsService } from 'services/widgets/settings/widget-settings';
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
  customEnabled =  this.value.settings.custom_enabled;

  private initialInputValue = this.editorInputValue;
  private serverInputValue = this.editorInputValue;
  private initialCustomEnabled = this.customEnabled;
  private serverCustomEnabled = this.initialCustomEnabled;

  isLoading = false;

  private settingsService: WidgetSettingsService<any>;

  created() {
    this.settingsService = this.widgetsService.getWidgetSettingsService(this.value.type);
  }

  get hasChanges() {
    return (this.serverInputValue !== this.editorInputValue) ||
      this.customEnabled !== this.serverCustomEnabled;
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
    newData.settings.custom_enabled = this.customEnabled;

    try {
      await this.settingsService.saveData(newData.settings);
    } catch (e) {
      alert($t('Something went wrong'));
      this.isLoading = false;
      return;
    }

    this.serverInputValue = this.editorInputValue;
    this.serverCustomEnabled = this.customEnabled;
    this.isLoading = false;
  }

  discardChanges() {
    const type = this.metadata.type;
    const newData = cloneDeep(this.value);
    newData.settings['custom_' + type] = this.initialInputValue;
    newData.settings.custom_enabled = this.customEnabled = this.initialCustomEnabled;
    this.emitInput(newData);
  }

  restoreDefaults() {
    if (!this.hasDefaults) return;
    const type = this.metadata.type;
    const newData = cloneDeep(this.value);
    newData.settings['custom_' + type] = this.value.custom_defaults[type];
    this.emitInput(newData);
  }

  emitInput(newValue: IWidgetData) {
    this.$emit('input', newValue);
    this.editorInputValue = newValue.settings['custom_' + this.metadata.type];
  }

}
