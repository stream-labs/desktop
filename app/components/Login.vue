<template>
  <div>
    <div v-if="loggedIn">
      <a class="link" @click="logout">
        <i class="icon-logout"/> <span class="user__name">{{ username }}</span>
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

.user__name {
  .semibold;

  @media(max-width: 1450px) {
    display: none;
  }
}
</style>
