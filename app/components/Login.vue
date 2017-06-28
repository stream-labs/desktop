<template>
  <div>
    <div
      v-if="loggedIn"
      class="user--logged-in">
      <div class="user__icon"><img src="../../media/images/icons/alertbox.png"></div>
      <div class="user__name">morganleee</div>
      <a class="logout link"><i class="fa fa-sign-out"/></a>
    </div>
    <div 
      v-else>
      <a class="link link--uppercase"><i class="fa fa-sign-in"/> Login</a>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

@Component({})
export default class Login extends Vue {
  loggedIn = false
}
</script>

<style lang="less" scoped>
@import "../styles/index";
.user--logged-in {
  display: flex;
  align-items: center;
}

.user__icon {
  margin-right: 8px;
  width: 30px;
  height: 30px;
  .radius;
  overflow: hidden;
}
.user__name {
  .semibold;
  color: @grey;
  .transition;
}
.logout {
  font-size: 14px;
  margin-left: 8px;
}
</style>
