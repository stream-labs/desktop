import Vue from 'vue';
import { cloneDeep } from 'lodash';
import { Component, Prop } from 'vue-property-decorator';
import { codemirror } from 'vue-codemirror';
import { CodeInput } from 'components/shared/inputs/inputs';
import { IWidgetData, WidgetSettingsService } from 'services/widget-settings/widget-settings';
import { Inject } from '../../util/injector';
import { WidgetsService } from 'services/widgets';
import { $t } from 'services/i18n/index';
import { IInputMetadata, metadata } from 'components/shared/inputs';
import FormGroup from 'components/shared/inputs/FormGroup.vue';

type TCustomFieldType =
  'colorpicker' |
  'slider' |
  'textfield' |
  'fontpicker' |
  'dropdown' |
  'image-input' |
  'sound-input';

export interface ICustomField {
  label: string;
  type: TCustomFieldType;
  value: string | number;

  options?: Dictionary<string>;
  max?: number;
  min?: number;
  steps?: number;
}

const DEFAULT_JSON: Dictionary<ICustomField> = {

  customField1: {
    label: 'Color Picker Example',
    type: 'colorpicker',
    value: '#000EF0'
  },

  customField2: {
    label: 'Slider Example',
    type: 'slider',
    value: 3,
    max: 200,
    min: 100,
    steps: 4
  },

  customField3: {
    label: 'Textfield Example',
    type: 'textfield',
    value: 'Hi There'
  },

  customField4: {
    label: 'Font Picker Example',
    type: 'fontpicker',
    value: 'Open Sans'
  },

  customField5: {
    label: 'Dropdown Example',
    type: 'dropdown',
    options: {
      optionA: 'Option A',
      optionB: 'Option B',
      optionC: 'Option C'
    },
    value: 'optionB'
  },

  customField6: {
    label: 'Image Input Example',
    type: 'image-input',
    value: null
  },

  customField7: {
    label: 'Sound Input Example',
    type: 'sound-input',
    value: null
  }

};


@Component({
  components: {
    CodeInput,
    FormGroup
  }
})
export default class CustomFieldsEditor extends Vue {

  @Inject() private widgetsService: WidgetsService;

  @Prop()
  value: IWidgetData;

  editorInputValue = this.value.settings['custom_json'];

  private initialInputValue = this.editorInputValue;
  private serverInputValue = this.editorInputValue;

  isEditMode = false;
  isLoading = false;

  private settingsService: WidgetSettingsService<any>;

  created() {
    this.settingsService = this.widgetsService.getWidgetSettingsService(this.value.type);
  }

  get hasCustomFields() {
    return this.editorInputValue !== null;
  }

  get hasChanges() {
    return this.serverInputValue !== this.editorInputValue;
  }

  get canSave() {
    return this.hasChanges && !this.isLoading;
  }

  get inputsData(): { value: number | string, metadata: IInputMetadata, fieldName: string }[] {
    const fields: Dictionary<ICustomField> = JSON.parse(this.editorInputValue);
    return Object.keys(fields).map((fieldName) => {
      const field = fields[fieldName];
      const inputValue = field.value;
      let inputMetadata: IInputMetadata;
      switch (field.type) {

        case 'colorpicker':
          inputMetadata = metadata.color({ title: field.label});
          break;

        case 'slider':
          inputMetadata = metadata.slider({
            title: field.label,
            max: field.max,
            min: field.min,
            interval:  field.steps
          });
          break;

        case 'textfield':
          inputMetadata = metadata.text({ title: field.label });
          break;

        case 'dropdown':
          inputMetadata = metadata.list({
            title: field.label,
            options: Object.keys(field.options).map(key => ({
              value: key,
              title: field.options[key]
            }))
          });
          break;

        // TODO: add image-input and sound-input
        default:
          inputMetadata = null;
          break;

      }
      return { value: inputValue, metadata: inputMetadata, fieldName };
    });
  }


  async save() {
    if (!this.canSave) return;

    try {
      JSON.stringify(this.editorInputValue);
    } catch (e) {
      alert($t('Invalid JSON'));
    }

    this.isLoading = true;

    const newData = cloneDeep(this.value);
    newData.settings['custom_json'] = this.editorInputValue;


    try {
      await this.settingsService.saveData(newData.settings);
    } catch (e) {
      alert($t('Something went wrong'));
      this.isLoading = false;
      return;
    }

    this.serverInputValue = this.editorInputValue;
    this.isLoading = false;
    this.setEditMode(false);
  }

  discardChanges() {
    const newData = cloneDeep(this.value);
    newData.settings['custom_json'] = this.initialInputValue;
    this.emitInput(newData);
  }

  setEditMode(enabled: boolean) {
    this.isEditMode = enabled;
  }

  addFields() {
    this.editorInputValue = JSON.stringify(DEFAULT_JSON, null, 2);
  }

  removeFields() {
    this.editorInputValue = null;
    this.setEditMode(false);
  }


  emitInput(newValue: IWidgetData) {
    this.$emit('input', newValue);
    this.editorInputValue = newValue.settings['custom_json'];
  }

}
