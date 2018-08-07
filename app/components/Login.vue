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
        <i class="fas fa-sign-in-alt"/> {{ $t('Login') }}
      </a>
    </div>
  </div>
</template>

<script lang="ts" src="./Login.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.user__name {
  .weight--medium();

  @media(max-width: 1600px) {
    display: none;
  }
}
</style>
