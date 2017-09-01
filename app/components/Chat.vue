<template>
  <webview
    class="chat"
    id="recentEventsWebview"
    :src="chatUrl">
  </webview>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from '../services/user';
import { Inject } from '../util/injector';
import { getPlatformService } from '../services/platforms';
import { CustomizationService } from '../services/customization';

@Component({})
export default class Chat extends Vue {
  @Inject()
  userService: UserService;

  @Inject()
  customizationService: CustomizationService;

  chatUrl: string = '';

  mounted() {
    const platform = this.userService.platform.type;
    const platformId = this.userService.platformId;
    const service = getPlatformService(platform);

    const username = this.userService.username;
    const oauthToken = this.userService.platform.token;
    const nightMode = this.customizationService.nightMode ? 'night' : 'day';

    service.getChatUrl(username, oauthToken, nightMode).then(chatUrl => {
       this.chatUrl = chatUrl;
    });
  }

  get isTwitch() {
    return this.userService.platform.type === 'twitch';
  }
}
</script>

<style lang="less" scoped>
@import "../styles/index";
.chat {
  height: 100%;
}
</style>
