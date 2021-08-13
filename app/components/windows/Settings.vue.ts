import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Subscription } from 'rxjs';
import { Inject } from '../../services/core/injector';
import ModalLayout from '../ModalLayout.vue';
import NavMenu from '../shared/NavMenu.vue';
import NavItem from '../shared/NavItem.vue';
import GenericFormGroups from 'components/obs/inputs/GenericFormGroups.vue';
import { WindowsService } from '../../services/windows';
import { UserService } from '../../services/user';
import { CustomizationService } from '../../services/customization';
import { ISettingsServiceApi, ISettingsSubCategory } from '../../services/settings';
import { StreamingService } from '../../services/streaming';
import ExtraSettings from '../ExtraSettings.vue';
import Hotkeys from '../Hotkeys.vue';
import NotificationsSettings from 'components/NotificationsSettings.vue';
import AppearanceSettings from 'components/AppearanceSettings.vue';
import ExperimentalSettings from 'components/ExperimentalSettings.vue';
import LanguageSettings from 'components/LanguageSettings.vue';
import { CategoryIcons } from './CategoryIcons';

@Component({
  components: {
    ModalLayout,
    GenericFormGroups,
    NavMenu,
    NavItem,
    ExtraSettings,
    Hotkeys,
    NotificationsSettings,
    AppearanceSettings,
    ExperimentalSettings,
    LanguageSettings,
  },
})
export default class Settings extends Vue {
  @Inject() settingsService: ISettingsServiceApi;
  @Inject() windowsService: WindowsService;
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;
  @Inject() streamingService: StreamingService;

  $refs: { settingsContainer: HTMLElement };

  categoryName: string = 'General';
  settingsData: ISettingsSubCategory[] = [];
  categoryNames = this.settingsService.getCategories();
  userSubscription: Subscription;
  icons = CategoryIcons;

  mounted() {
    // Categories depend on whether the user is logged in or not.
    // When they depend another state, it's time to refine this implementation.
    this.userSubscription = this.userService.userLoginState.subscribe(() => {
      this.categoryNames = this.settingsService.getCategories();
      // reopen settings because new categories may not have previous category
      this.settingsService.showSettings();
    });

    this.categoryName = this.getInitialCategoryName();
    this.settingsData = this.settingsService.getSettingsFormData(this.categoryName);
  }

  beforeDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  get isStreaming() {
    return this.streamingService.isStreaming;
  }

  getInitialCategoryName() {
    if (this.windowsService.state.child.queryParams) {
      return this.windowsService.state.child.queryParams.categoryName || 'General';
    }
    return 'General';
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
    this.$refs.settingsContainer.scrollTop = 0;
  }
}
