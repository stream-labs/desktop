import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from '../services/user';
import { Inject } from '../util/injector';
import { getPlatformService } from '../services/platforms';
import { CustomizationService } from '../services/customization';
import url from 'url';
import electron from 'electron';

@Component({})
export default class Chat extends Vue {
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;

  chatUrl: string = '';

  $refs: {
    chat: Electron.WebviewTag;
  };

  mounted() {
    const platform = this.userService.platform.type;
    const service = getPlatformService(platform);
    const nightMode = this.customizationService.nightMode ? 'night' : 'day';

    service.getChatUrl(nightMode).then(chatUrl => this.chatUrl = chatUrl);

    this.$refs.chat.addEventListener('new-window', e => {
      const protocol = url.parse(e.url).protocol;

      if (protocol === 'http:' || protocol === 'https:') {
        electron.remote.shell.openExternal(e.url);
      }
    });

    this.$refs.chat.addEventListener('dom-ready', () => {
      this.$refs.chat.setZoomFactor(this.customizationService.state.chatZoomFactor);
    });
  }

  get isTwitch() {
    return this.userService.platform.type === 'twitch';
  }

  refresh() {
    this.$refs.chat.reload();
  }
}
