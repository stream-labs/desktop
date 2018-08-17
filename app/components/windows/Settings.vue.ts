import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import NavMenu from '../shared/NavMenu.vue';
import NavItem from '../shared/NavItem.vue';
import GenericFormGroups from 'components/obs/inputs/GenericFormGroups.vue';
import { WindowsService } from '../../services/windows';
import { ISettingsServiceApi, ISettingsSubCategory } from '../../services/settings';
import ExtraSettings from '../ExtraSettings.vue';
import ApiSettings from '../ApiSettings.vue';
import Hotkeys from '../Hotkeys.vue';
import OverlaySettings from 'components/OverlaySettings.vue';
import NotificationsSettings from 'components/NotificationsSettings.vue';
import AppearanceSettings from 'components/AppearanceSettings.vue';
import ExperimentalSettings from 'components/ExperimentalSettings.vue';
import RemoteControlSettings from 'components/RemoteControlSettings.vue';
import LanguageSettings from 'components/LanguageSettings.vue';

@Component({
  components: {
    ModalLayout,
    GenericFormGroups,
    NavMenu,
    NavItem,
    ExtraSettings,
    Hotkeys,
    ApiSettings,
    OverlaySettings,
    NotificationsSettings,
    AppearanceSettings,
    RemoteControlSettings,
    ExperimentalSettings,
    LanguageSettings
  }
})
export default class SceneTransitions extends Vue {
  @Inject() settingsService: ISettingsServiceApi;
  @Inject() windowsService: WindowsService;

  settingsData = this.settingsService.getSettingsFormData(this.categoryName);
  icons: Dictionary<string> = {
    General: 'icon-overview',
    Stream: 'fas fa-globe',
    Output: 'fas fa-microchip',
    Video: 'fas fa-film',
    Audio: 'icon-audio',
    Hotkeys: 'icon-settings',
    Advanced: 'fas fa-cogs',
    API: 'far fa-file-code',
    'Scene Collections': 'icon-themes',
    Notifications: 'icon-notifications',
    Appearance: 'icon-settings-3-1',
    'Remote Control': 'fas fa-play-circle',
    Experimental: 'fas fa-flask'
  };

  get categoryName() {
    return this.windowsService.state.child.queryParams.categoryName || 'General';
  }

  set categoryName(name) {
    this.settingsService.showSettings(name);
  }

  get categoryNames() {
    return this.settingsService.getCategories();
  }

  save(settingsData: ISettingsSubCategory[]) {
    this.settingsService.setSettings(this.categoryName, settingsData);
    this.settingsData = this.settingsService.getSettingsFormData(this.categoryName);
  }

  done() {
    this.windowsService.closeChildWindow();
  }

  @Watch('categoryName')
  onCategoryNameChangedHandler(categoryName: string) {
    this.settingsData = this.settingsService.getSettingsFormData(categoryName);
    const el = this.$refs.settingsContainer as HTMLElement;
    el.scrollTop = 0;
  }

}
