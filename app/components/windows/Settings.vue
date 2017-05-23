<template>
<modal-layout
  title="Settings"
  :show-cancel="false"
  :done-handler="done">

  <div slot="content">
    <div class="row">
      <div class="columns small-3">
        <NavMenu v-model="categoryName" class="side-menu">
          <NavItem
            v-for="category in categoriesNames"
            :to="category"
          >
            {{ category }}
          </NavItem>
        </NavMenu>
      </div>
      <div class="columns small-9">
        <startup-settings v-if="categoryName === 'General'" />
        <hotkeys v-if="categoryName === 'Hotkeys'" />
        <GenericFormGroups
          v-if="categoryName !== 'Hotkeys'"
          v-model="settingsData"
          @input="save" />
      </div>
    </div>
  </div>

</modal-layout>
</template>

<script>
import ModalLayout from '../ModalLayout.vue';
import NavMenu from '../shared/NavMenu.vue';
import NavItem from '../shared/NavItem.vue';
import GenericFormGroups from '../shared/forms/GenericFormGroups.vue';
import windowManager from '../../util/WindowManager';
import SettingsService from '../../services/settings';
import windowMixin from '../mixins/window';
import StartupSettings from '../StartupSettings.vue';
import Hotkeys from '../Hotkeys.vue';

export default {

  mixins: [windowMixin],

  components: {
    ModalLayout,
    NavMenu,
    NavItem,
    GenericFormGroups,
    StartupSettings,
    Hotkeys
  },

  beforeCreate() {
    this.settingsService = SettingsService.instance;
    this.settingsService.loadSettingsIntoStore();
  },

  data() {
    const categoryName = 'General';
    return {
      categoryName,
      categoriesNames: this.settingsService.getCategories(),
      settingsData: this.settingsService.getSettingsFormData(categoryName)
    };
  },

  methods: {

    save(settingsData) {
      this.settingsService.setSettings(this.categoryName, settingsData);
      this.settingsData = this.settingsService.getSettingsFormData(this.categoryName);
    },


    done() {
      windowManager.closeWindow();
    }
  },


  watch: {
    categoryName(categoryName) {
      this.settingsData = this.settingsService.getSettingsFormData(categoryName);
    }
  }
};
</script>

<style lang="less" scoped>

.side-menu {
  position: fixed;
  left: 0;
}

</style>
