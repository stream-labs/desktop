import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import SideNav from '../SideNav.vue';
import { ScenesService } from 'services/scenes';

// Pages
import Studio from '../pages/Studio.vue';
import Onboarding from '../pages/Onboarding.vue';
import TitleBar from '../TitleBar.vue';
import { Inject } from '../../services/core/injector';
import { CustomizationService } from 'services/customization';
import { NavigationService } from 'services/navigation';
import { AppService } from 'services/app';
import { UserService } from 'services/user';
import { WindowsService } from 'services/windows';
import StudioFooter from '../StudioFooter.vue';
import CustomLoader from '../CustomLoader.vue';
import PatchNotes from '../pages/PatchNotes.vue';
import NicoliveArea from '../nicolive-area/NicoliveArea.vue';
import electron from 'electron';

@Component({
  components: {
    TitleBar,
    SideNav,
    Studio,
    Onboarding,
    StudioFooter,
    CustomLoader,
    PatchNotes,
    NicoliveArea,
  },
})
export default class Main extends Vue {
  @Inject() customizationService: CustomizationService;
  @Inject() navigationService: NavigationService;
  @Inject() appService: AppService;
  @Inject() userService: UserService;
  @Inject() windowsService: WindowsService;
  @Inject() scenesService: ScenesService;

  mounted() {
    electron.remote.getCurrentWindow().show();
  }

  get title() {
    return this.windowsService.state.main.title;
  }

  get page() {
    return this.navigationService.state.currentPage;
  }

  get params() {
    return this.navigationService.state.params;
  }

  get applicationLoading() {
    return this.appService.state.loading;
  }

  get isLoggedIn() {
    return this.userService.isLoggedIn();
  }

  get isOnboarding() {
    return this.navigationService.state.currentPage === 'Onboarding';
  }

  get showNicoliveArea() {
    return this.page === 'Studio' && this.isLoggedIn;
  }

  /**
   * Only certain pages get locked out while the application
   * is loading.  Other pages are OK to keep using.
   */
  get shouldLockContent() {
    return this.applicationLoading && this.navigationService.state.currentPage === 'Studio';
  }

  onDropHandler(event: DragEvent) {
    const files = event.dataTransfer.files;

    let fi = files.length;
    while (fi--) {
      const file = files.item(fi);
      this.scenesService.activeScene.addFile(file.path);
    }
  }
}
