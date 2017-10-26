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
            v-for="category in categoryNames"
            :to="category"
            :ico="icons[category]"
          >
            {{ category }}
          </NavItem>
        </NavMenu>
      </div>
      <div class="columns small-9 no-padding-right">
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

<script lang="ts">
import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from '../../services/service';
import ModalLayout from '../ModalLayout.vue';
import NavMenu from '../shared/NavMenu.vue';
import NavItem from '../shared/NavItem.vue';
import GenericFormGroups from '../shared/forms/GenericFormGroups.vue';
import windowManager from '../../util/WindowManager';
import { SettingsService, ISettingsState, ISettingsSubCategory } from '../../services/settings';
import windowMixin from '../mixins/window';
import StartupSettings from '../StartupSettings.vue';
import Hotkeys from '../Hotkeys.vue';

@Component({
  components: {
    ModalLayout,
    GenericFormGroups,
    NavMenu,
    NavItem,
    StartupSettings,
    Hotkeys
  },
  mixins: [windowMixin]
})
export default class SceneTransitions extends Vue {

  @Inject()
  settingsService: SettingsService;

  categoryName = 'General';
  settingsData = this.settingsService.getSettingsFormData(this.categoryName);
  icons: {[key in keyof ISettingsState]: string} = {
    General: 'th-large',
    Stream: 'globe',
    Output: 'microchip',
    Video: 'film',
    Audio: 'volume-up',
    Hotkeys: 'keyboard-o',
    Advanced: 'cogs'
  };


  get categoryNames() {
    return this.settingsService.getCategories().filter(name => {
      return name !== 'Audio';
    });
  }


  save(settingsData: ISettingsSubCategory[]) {
    this.settingsService.setSettings(this.categoryName, settingsData);
    this.settingsData = this.settingsService.getSettingsFormData(this.categoryName);
  }


  done() {
    windowManager.closeWindow();
  }

  @Watch('categoryName')
  onCategoryNameChangedHandler(categoryName: string) {
    this.settingsData = this.settingsService.getSettingsFormData(categoryName);
  }

}
</script>

<style lang="less" scoped>

.side-menu {
  position: fixed;
  left: 0;
}

</style>
