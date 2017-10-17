import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from '../services/user';
import { Inject } from '../util/injector';
import { getPlatformService } from '../services/platforms';
import { CustomizationService } from '../services/customization';

@Component({})
export default class Chat extends Vue {
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;

  chatUrl: string = '';

  mounted() {
    const platform = this.userService.platform.type;
    const service = getPlatformService(platform);
    const nightMode = this.customizationService.nightMode ? 'night' : 'day';

    service.getChatUrl(nightMode).then(chatUrl => this.chatUrl = chatUrl);
  }

  get isTwitch() {
    return this.userService.platform.type === 'twitch';
  }
}
