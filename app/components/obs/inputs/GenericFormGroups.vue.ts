import Vue from 'vue';
import GenericForm from './GenericForm.vue';
import AdvancedOutputTabs from './AdvancedOutputTabs.vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { ISettingsSubCategory, SettingsService } from '../../../services/settings';
import { Inject } from 'services/core/injector';
import TsxComponent from 'components/tsx-component';

@Component({
  components: { AdvancedOutputTabs, GenericForm },
})
export default class GenericFormGroups extends TsxComponent<{
  value: ISettingsSubCategory[];
  categoryName?: string;
  onInput?: Function;
}> {
  @Inject() settingsService: SettingsService;

  @Prop() value: ISettingsSubCategory[];
  @Prop() categoryName: string;
  @Prop() onInput?: Function;

  collapsedGroups: Dictionary<boolean> = {};

  isAdvancedOutput = this.settingsService.isTabbedForm(this.categoryName) || false;

  toggleGroup(index: string) {
    this.$set(this.collapsedGroups, index, !this.collapsedGroups[index]);
  }

  onInputHandler() {
    if (this.onInput) this.onInput(this.value);
    this.$emit('input', this.value);

    this.$nextTick(this.updateIsAdvancedOutput);
  }

  @Watch('categoryName')
  updateIsAdvancedOutput() {
    this.isAdvancedOutput = this.settingsService.isTabbedForm(this.categoryName);
  }

  hasAnyVisibleSettings(category: ISettingsSubCategory) {
    return !!category.parameters.find(setting => {
      return setting.visible;
    });
  }
}
