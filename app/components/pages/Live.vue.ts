import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import SceneSelector from '../SceneSelector.vue';
import Mixer from '../Mixer.vue';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';

@Component({
  components: {
    SceneSelector,
    Mixer
  }
})
export default class Live extends Vue {
  @Inject()
  userService: UserService;

  get recenteventsUrl() {
    return this.userService.widgetUrl('recent-events');
  }
}
