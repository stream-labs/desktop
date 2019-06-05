import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { ISettingsSubCategory } from 'services/settings';
import Tabs, { ITab } from 'components/Tabs.vue';
import GenericForm from './GenericForm.vue';

@Component({ components: { GenericForm, Tabs } })
export default class AdvancedOutputTabs extends Vue {
  @Prop() value: ISettingsSubCategory[];
  currentTab: string = 'Streaming';

  get tabs() {
    const tabs = this.value
      .filter(val => val.nameSubCategory !== 'Untitled')
      // Exclude audio tabs since they're multiple of these and we only want one
      .filter(val => !val.nameSubCategory.startsWith('Audio - Track'))
      .map(toTab);

    /*
     * Insert "Audio" tab as the 3rd tab, since it looks more intuitive this way.
     * TODO: I'd avoid mutation, but since we're not sold on that idea yet, we rather do it like
     *  this instead of adding complexity or introducing deps.
     */
    const audioTab: ITab = { name: 'Audio', value: 'Audio' };
    tabs.splice(2, 0, audioTab);

    return tabs;
  }

  setCurrentTab(tab: string) {
    this.currentTab = tab;
  }

  onInputHandler() {
    this.$emit('input', this.value);
  }

  /**
   * Properties of the form group that shouldn't be displayed in tabs UI but as standalone on top
   */
  get standaloneProps() {
    return this.value.filter(val => val.nameSubCategory === 'Untitled');
  }

  /**
   * Audio properties are managed separately as we have Audio Track - 1, Audio Track - 2, etc
   * coming from backend, and we don't want to display tabs for all of them, but condense them
   * all into the "Audio" tab.
   */
  get audioProps() {
    return this.value.filter(val => val.nameSubCategory.startsWith('Audio - Track'));
  }
}

const toTab = (val: ISettingsSubCategory): ITab => ({
  name: val.nameSubCategory,
  value: val.nameSubCategory,
});
