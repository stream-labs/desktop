import Vue from 'vue';
import GenericForm from './GenericForm.vue';
import { Component, Prop } from 'vue-property-decorator';
import { ISettingsSubCategory } from '../../../services/settings/index';

@Component({
  components: { GenericForm },
})
export default class GenericFormGroups extends Vue {
  @Prop()
  value: ISettingsSubCategory[];

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
}
