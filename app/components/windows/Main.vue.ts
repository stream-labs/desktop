import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import TopNav from '../TopNav.vue';

// Pages
import Studio from '../pages/Studio.vue';
import Dashboard from '../pages/Dashboard.vue';
import Live from '../pages/Live.vue';
import Onboarding from '../pages/Onboarding.vue';
import TitleBar from '../TitleBar.vue';
import windowMixin from '../mixins/window';
import { Inject } from '../../util/injector';
import { CustomizationService } from '../../services/customization';
import { NavigationService } from '../../services/navigation';
import { AppService } from '../../services/app';
import electron from 'electron';

const { remote } = electron;

@Component({
  mixins: [windowMixin],
  components: {
    TitleBar,
    TopNav,
    Studio,
    Dashboard,
    Live,
    Onboarding
  }
})
export default class Main extends Vue {

  title = `Streamlabs OBS - Version: ${remote.process.env.SLOBS_VERSION}`;

  @Inject()
  customizationService: CustomizationService;

  @Inject()
  navigationService: NavigationService;

  @Inject()
  appService: AppService;

  get page() {
    return this.navigationService.state.currentPage;
  }

  get nightTheme() {
    return this.customizationService.nightMode;
  }

  get applicationLoading() {
    return this.appService.state.loading;
  }

}
