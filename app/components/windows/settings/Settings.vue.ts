import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ModalLayout from 'components/ModalLayout.vue';
import NavMenu from 'components/shared/NavMenu.vue';
import NavItem from 'components/shared/NavItem.vue';
import GenericFormGroups from 'components/obs/inputs/GenericFormGroups.vue';
import { WindowsService } from 'services/windows';
import { ISettingsSubCategory, SettingsService } from 'services/settings/index';
import DeveloperSettings from './DeveloperSettings';
import InstalledApps from 'components/InstalledApps.vue';
import Hotkeys from './Hotkeys.vue';
import OverlaySettings from './OverlaySettings';
import NotificationsSettings from './NotificationsSettings.vue';
import ExperimentalSettings from './ExperimentalSettings.vue';
import RemoteControlSettings from './RemoteControlSettings.vue';
import GameOverlaySettings from './GameOverlaySettings';
import SearchablePages from 'components/shared/SearchablePages';
import FormInput from 'components/shared/inputs/FormInput.vue';
import StreamSettings from './StreamSettings';
import VirtualWebcamSettings from './VirtualWebcamSettings';
import { MagicLinkService } from 'services/magic-link';
import { UserService } from 'services/user';
import Scrollable from 'components/shared/Scrollable';
import { ObsSettings, PlatformLogo } from 'components/shared/ReactComponentList';
import { $t } from 'services/i18n';
import { debounce } from 'lodash-decorators';
import * as remote from '@electron/remote';

@Component({
  components: {
    ModalLayout,
    SearchablePages,
    GenericFormGroups,
    NavMenu,
    NavItem,
    Hotkeys,
    DeveloperSettings,
    OverlaySettings,
    NotificationsSettings,
    RemoteControlSettings,
    ExperimentalSettings,
    InstalledApps,
    GameOverlaySettings,
    FormInput,
    StreamSettings,
    VirtualWebcamSettings,
    Scrollable,
    PlatformLogo,
    ObsSettings,
  },
})
export default class Settings extends Vue {
  @Inject() settingsService: SettingsService;
  @Inject() windowsService: WindowsService;
  @Inject() magicLinkService: MagicLinkService;
  @Inject() userService: UserService;

  $refs: { settingsContainer: HTMLElement & SearchablePages };

  searchStr = '';
  searchResultPages: string[] = [];
  icons: Dictionary<string> = {
    General: 'icon-overview',
    Stream: 'fas fa-globe',
    Output: 'fas fa-microchip',
    Video: 'fas fa-film',
    Audio: 'icon-audio',
    Hotkeys: 'icon-settings',
    'Game Overlay': 'icon-full-screen',
    'Virtual Webcam': 'fas fa-camera',
    Advanced: 'fas fa-cogs',
    Developer: 'far fa-file-code',
    'Scene Collections': 'icon-themes',
    Notifications: 'icon-notifications',
    Appearance: 'icon-settings-3-1',
    'Face Masks': 'icon-face-masks-3',
    'Remote Control': 'fas fa-play-circle',
    Experimental: 'fas fa-flask',
    'Installed Apps': 'icon-store',
  };

  internalCategoryName: string = null;

  created() {
    // Make sure we have the latest settings
    this.settingsService.actions.loadSettingsIntoStore();
  }

  /**
   * Whether we have built a cache of searchable pages already.
   * If we havne't - we should debounce the user input.
   * If we have - no need to debounce and we should preserve a snappy experience
   */
  scanningDone = false;

  get categoryName() {
    if (this.internalCategoryName == null) {
      this.internalCategoryName = this.getInitialCategoryName();
    }

    return this.internalCategoryName;
  }

  get settingsData() {
    return this.settingsService.state[this.categoryName]?.formData ?? [];
  }

  set categoryName(val: string) {
    if (val === 'Prime') {
      this.magicLinkService.actions.linkToPrime('slobs-settings');
    } else {
      this.internalCategoryName = val;
    }
  }

  get isPrime() {
    return this.userService.views.isPrime;
  }

  get isLoggedIn() {
    return this.userService.views.isLoggedIn;
  }

  /**
   * returns the list of the pages ported to React
   */
  get reactPages() {
    return [
      'General',
      // 'Stream',
      // 'Output',
      // 'Audio',
      // 'Video',
      // 'Hotkeys',
      'Advanced',
      // 'SceneCollections',
      // 'Notifications',
      'Appearance',
      // 'RemoteControl',
      // 'VirtualWebcam',
      // 'GameOverlay'
    ];
  }

  get shouldShowReactPage() {
    return this.reactPages.includes(this.categoryName);
  }

  get shouldShowVuePage() {
    if (this.reactPages.includes(this.categoryName)) return false;
    return ![
      'Hotkeys',
      'Stream',
      'API',
      'Overlays',
      'Notifications',
      'Appearance',
      'Experimental',
      'Remote Control',
      'Installed Apps',
      'Virtual Webcam',
      'Developer',
    ].includes(this.categoryName);
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
  }

  done() {
    this.windowsService.closeChildWindow();
  }

  @Watch('categoryName')
  onCategoryNameChangedHandler(categoryName: string) {
    this.$refs.settingsContainer.scrollTop = 0;
  }

  originalCategory: string = null;

  onBeforePageScanHandler(page: string) {
    if (this.originalCategory == null) {
      this.originalCategory = this.categoryName;
    }

    this.categoryName = page;
  }

  onScanCompletedHandler() {
    this.scanningDone = true;
    this.categoryName = this.originalCategory;
    this.originalCategory = null;
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

  onSearchInput(str: string) {
    if (this.scanningDone) {
      this.searchStr = str;
    } else {
      this.debouncedSearchInput(str);
    }
  }

  @debounce(300)
  debouncedSearchInput(str: string) {
    this.searchStr = str;
  }

  highlightSearch(searchStr: string) {
    this.$refs.settingsContainer.highlightPage(searchStr);
  }

  handleAuth() {
    if (this.userService.isLoggedIn) {
      remote.dialog
        .showMessageBox({
          title: $t('Confirm'),
          message: $t('Are you sure you want to log out?'),
          buttons: [$t('Yes'), $t('No')],
        })
        .then(({ response }) => {
          if (response === 0) {
            this.userService.logOut();
          }
        });
    } else {
      this.windowsService.closeChildWindow();
      this.userService.showLogin();
    }
  }
}
