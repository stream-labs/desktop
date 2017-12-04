import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';

@Component({})
export default class BrowseOverlays extends Vue {
  @Inject() userService: UserService;

  get overlaysUrl() {
    return this.userService.overlaysUrl();
  }
}
