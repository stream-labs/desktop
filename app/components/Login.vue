<template>
  <div class="login__status" v-if="loggedIn">
    <a v-if="!compactMode" class="link" @click="logout" :title="$t('common.logout')">
      <i class="icon-log-out" />
    </a>
    <a @click="openUserPage" class="user__profile" :title="username">
      <img class="user__thumbnail" :src="userIcon" />
    </a>
  </div>
  <div v-else>
    <a v-if="!compactMode" class="link" @click="login" :title="$t('common.login')">
      <i class="icon-log-in" />
    </a>
  </div>
</template>

<script lang="ts" src="./Login.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/index';

.login__status {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.user__profile {
  height: 40px;
  width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;

  .user__thumbnail {
    display: flex;
    align-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: @text-secondary;
  }
}

.link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 36px;
}
</style>
