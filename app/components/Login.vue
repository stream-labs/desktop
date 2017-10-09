<template>
  <div>
    <div
      v-if="loggedIn"
      class="user--logged-in">
      <!--<div class="user__icon"><img src="../../media/images/icons/alertbox.png"></div>-->
      <a class="logout link" @click="logout">
        <i class="fa fa-sign-out"/> <span class="user__name">{{ username }}</span>
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

<script lang="ts" src="./Login.vue.ts"></script>

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
}

.logout {
  font-size: 14px;
  margin-left: 8px;
}
</style>
