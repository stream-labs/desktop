import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Subscription } from 'rxjs/Subscription';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import NavMenu from '../shared/NavMenu.vue';
import NavItem from '../shared/NavItem.vue';
import GenericFormGroups from '../shared/forms/GenericFormGroups.vue';
import { WindowsService } from '../../services/windows';
import { UserService } from '../../services/user';
import { CustomizationService } from '../../services/customization';
import { SettingsService, ISettingsSubCategory } from '../../services/settings';
import windowMixin from '../mixins/window';
import ExtraSettings from '../ExtraSettings.vue';
import ApiSettings from '../ApiSettings.vue';
import Hotkeys from '../Hotkeys.vue';
import NotificationsSettings from 'components/NotificationsSettings.vue';
import AppearanceSettings from 'components/AppearanceSettings.vue';
import ExperimentalSettings from 'components/ExperimentalSettings.vue';
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
    NotificationsSettings,
    AppearanceSettings,
    ExperimentalSettings,
    LanguageSettings
  },
  mixins: [windowMixin]
})
export default class Settings extends Vue {
  @Inject() settingsService: SettingsService;
  @Inject() windowsService: WindowsService;
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;

  settingsData = this.settingsService.getSettingsFormData(this.categoryName);
  categoryNames = this.settingsService.getCategories();
  userSubscription: Subscription;
  icons: Dictionary<string> = {
    General: 'icon-settings',
    Stream: 'icon-video',
    Output: 'icon-output',
    Video: 'icon-video',
    Audio: 'icon-speaker',
    Hotkeys: 'icon-keyborad',
    Advanced: 'icon-details-setting',
  };

  mounted() {
    // Categories depend on whether the user is logged in or not.
    // When they depend another state, it's time to refine this implementation.
    this.userSubscription = this.userService.userLoginState.subscribe(() => {
      this.categoryNames = this.settingsService.getCategories();
      // reopen settings because new categories may not have previous category
      this.settingsService.showSettings();
    });
  }

  beforeDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  get categoryName() {
    return this.windowsService.state.child.queryParams.categoryName || 'General';
  }

  set categoryName(name) {
    this.settingsService.showSettings(name);
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
  }

}
