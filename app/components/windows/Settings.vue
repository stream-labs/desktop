<template>
<modal-layout
  title="Settings"
  :show-cancel="false"
  :done-handler="done">

  <div slot="content" class="settings">
    <NavMenu v-model="categoryName" class="side-menu">
      <NavItem
        v-for="category in categoryNames"
        :to="category"
        :ico="icons[category]"
      >
        {{ category }}
      </NavItem>
    </NavMenu>
    <div class="settings-container">
      <extra-settings v-if="categoryName === 'General'" />
      <hotkeys v-if="categoryName === 'Hotkeys'" />
      <GenericFormGroups
        v-if="categoryName !== 'Hotkeys'"
        v-model="settingsData"
        @input="save" />
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
import { WindowService } from '../../services/window';
import { SettingsService, ISettingsState, ISettingsSubCategory } from '../../services/settings';
import windowMixin from '../mixins/window';
import ExtraSettings from '../ExtraSettings.vue';
import Hotkeys from '../Hotkeys.vue';

@Component({
  components: {
    ModalLayout,
    GenericFormGroups,
    NavMenu,
    NavItem,
    ExtraSettings,
    Hotkeys
  },
  mixins: [windowMixin]
})
export default class SceneTransitions extends Vue {

  @Inject()
  settingsService: SettingsService;

  windowService = WindowService.instance;

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
    this.windowService.closeWindow();
  }

  @Watch('categoryName')
  onCategoryNameChangedHandler(categoryName: string) {
    this.settingsData = this.settingsService.getSettingsFormData(categoryName);
  }

}
</script>

<style lang="less" scoped>
.settings {
  display: flex;
  align-content: stretch;
  align-items: stretch;
  height: 100%;
}

.settings-container {
  flex-grow: 1;
  margin: -20px -20px -20px 0;
  overflow: auto;
}
</style>

<style lang="less">
.settings-container {
  .input-container {
    flex-direction: column;

    .input-label, .input-wrapper {
      width: 100%;
    }

    .input-label {
      label {
        margin-bottom: 8px;
      }
    }
  }
}
</style>
