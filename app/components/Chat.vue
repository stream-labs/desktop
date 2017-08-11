<template>
  <webview class="chat" id="recentEventsWebview" :src="chatUrl"></webview>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from '../services/user';
import { Inject } from '../util/injector';

@Component({})
export default class Chat extends Vue {
  @Inject()
  userService: UserService;

  //getters

  get chatUrl() {
    return this.userService.chatUrl;
  }
}
</script>

<style lang="less" scoped>
@import "../styles/index";
.chat {
  height: 100%;
}
</style>
