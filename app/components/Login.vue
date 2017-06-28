<template>
  <div>
    <div
      v-if="loggedIn"
      class="user--logged-in">
      <!--<div class="user__icon"><img src="../../media/images/icons/alertbox.png"></div>-->
      <div class="user__name">{{ username }}</div>
      <a class="logout link" @click="logout">
        <i class="fa fa-sign-out"/>
      </a>
    </div>
    <div 
      v-else>
      <a class="link link--uppercase" @click="login">
        <i class="fa fa-sign-in"/> Login
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { UserService } from '../services/user';
import { OnboardingService } from '../services/onboarding';
import { Inject } from '../services/service';

@Component({})
export default class Login extends Vue {

  @Inject()
  userService: UserService;

  @Inject()
  onboardingService: OnboardingService;

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get username() {
    return this.userService.username;
  }

  logout() {
    if (confirm('Are you sure you want to log out?')) {
      this.userService.logOut();
    }
  }

  login() {
    // For now, we start the onboarding flow again.  We should
    // improve this UX to have a dedicated standalone login
    // page, but that hasn't been built yet.
    this.onboardingService.start();
  }
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
