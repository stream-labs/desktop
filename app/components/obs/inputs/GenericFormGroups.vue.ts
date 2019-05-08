import Vue from 'vue';
import GenericForm from './GenericForm.vue';
import AdvancedOutputTabs from './AdvancedOutputTabs.vue';
import { Component, Prop } from 'vue-property-decorator';
import { ISettingsSubCategory, SettingsService } from '../../../services/settings';
import { Inject } from 'util/injector';

@Component({
  components: { AdvancedOutputTabs, GenericForm },
})
export default class GenericFormGroups extends Vue {
  @Inject() settingsService: SettingsService;

  @Prop() value: ISettingsSubCategory[];
  @Prop() categoryName: string;

  collapsedGroups: Dictionary<boolean> = {};

  toggleGroup(index: string) {
    this.$set(this.collapsedGroups, index, !this.collapsedGroups[index]);
  }

  onInputHandler() {
    this.$emit('input', this.value);
  }

  hasAnyVisibleSettings(category: ISettingsSubCategory) {
    return !!category.parameters.find(setting => {
      return setting.visible;
    });
  }

  get isAdvancedOutput() {
    return this.settingsService.isTabbedForm(this.categoryName);
  }
}
