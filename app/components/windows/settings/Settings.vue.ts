import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ModalLayout from 'components/ModalLayout.vue';
import NavMenu from 'components/shared/NavMenu.vue';
import NavItem from 'components/shared/NavItem.vue';
import GenericFormGroups from 'components/obs/inputs/GenericFormGroups.vue';
import { WindowsService } from 'services/windows';
import { ISettingsServiceApi, ISettingsSubCategory } from 'services/settings/index';
import ExtraSettings from './ExtraSettings.vue';
import DeveloperSettings from './DeveloperSettings';
import InstalledApps from 'components/InstalledApps.vue';
import Hotkeys from './Hotkeys.vue';
import OverlaySettings from './OverlaySettings.vue';
import NotificationsSettings from './NotificationsSettings.vue';
import AppearanceSettings from './AppearanceSettings';
import ExperimentalSettings from './ExperimentalSettings.vue';
import RemoteControlSettings from './RemoteControlSettings.vue';
import LanguageSettings from './LanguageSettings.vue';
import GameOverlaySettings from './GameOverlaySettings';
import FacemaskSettings from './FacemaskSettings.vue';
import SearchablePages from 'components/shared/SearchablePages';
import FormInput from 'components/shared/inputs/FormInput.vue';
import StreamSettings from './StreamSettings';

@Component({
  components: {
    ModalLayout,
    SearchablePages,
    GenericFormGroups,
    NavMenu,
    NavItem,
    ExtraSettings,
    Hotkeys,
    DeveloperSettings,
    OverlaySettings,
    NotificationsSettings,
    AppearanceSettings,
    RemoteControlSettings,
    ExperimentalSettings,
    LanguageSettings,
    InstalledApps,
    GameOverlaySettings,
    FacemaskSettings,
    FormInput,
    StreamSettings,
  },
})
export default class Settings extends Vue {
  @Inject() settingsService: ISettingsServiceApi;
  @Inject() windowsService: WindowsService;

  $refs: { settingsContainer: HTMLElement & SearchablePages };

  searchStr = '';
  searchResultPages: string[] = [];
  categoryName: string = 'General';
  settingsData: ISettingsSubCategory[] = [];
  icons: Dictionary<string> = {
    General: 'icon-overview',
    Stream: 'fas fa-globe',
    Output: 'fas fa-microchip',
    Video: 'fas fa-film',
    Audio: 'icon-audio',
    Hotkeys: 'icon-settings',
    'Game Overlay': 'icon-full-screen',
    Advanced: 'fas fa-cogs',
    Developer: 'far fa-file-code',
    'Scene Collections': 'icon-themes',
    Notifications: 'icon-notifications',
    Appearance: 'icon-settings-3-1',
    Facemasks: 'icon-face-masks-3',
    'Remote Control': 'fas fa-play-circle',
    Experimental: 'fas fa-flask',
    'Installed Apps': 'icon-store',
  };

  mounted() {
    this.categoryName = this.getInitialCategoryName();
    this.settingsData = this.settingsService.getSettingsFormData(this.categoryName);
  }

  getInitialCategoryName() {
    if (this.windowsService.state.child.queryParams) {
      return this.windowsService.state.child.queryParams.categoryName || 'General';
    }
    return 'General';
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
    this.settingsData = this.getSettingsData(categoryName);
    this.$refs.settingsContainer.scrollTop = 0;
  }

  getSettingsData(categoryName: string) {
    return this.settingsService.getSettingsFormData(categoryName);
  }

  onBeforePageScanHandler(page: string) {
    this.settingsData = this.getSettingsData(page);
  }

  onPageRenderHandler(page: string) {
    // hotkeys.vue has a delayed rendering, we have to wait before scanning
    if (page === 'Hotkeys') return new Promise(r => setTimeout(r, 500));
  }

  onSearchCompletedHandler(foundPages: string[]) {
    this.searchResultPages = foundPages;
    // if there are not search results for the current page than switch to the first found page
    if (foundPages.length && !foundPages.includes(this.categoryName)) {
      this.categoryName = foundPages[0];
    }
  }

  highlightSearch(searchStr: string) {
    this.$refs.settingsContainer.highlightPage(searchStr);
  }
}
