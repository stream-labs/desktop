import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import SceneSelector from '../SceneSelector.vue';
import SourceSelector from '../SourceSelector.vue';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';

@Component({
  components: {
    SceneSelector,
    SourceSelector,
  }
})
export default class Dashboard extends Vue {
  @Inject()
  userService: UserService;

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get dashboardUrl() {
    return this.userService.widgetUrl('dashboard');
  }
}
