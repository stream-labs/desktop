<template>
  <div>
    <div class="login__status" v-if="loggedIn">
      <a
        @click="openUserpage"
        class="link user__profile">
          <img class="user__thumbnail" :src="userIcon">
          <span class="user__name">{{ username }}</span>
      </a>
      <a class="link" @click="logout">
        <i class="icon-log-out"/> {{ $t('common.logout') }}
      </a>
    </div>
    <div
      v-else>
      <a class="link" @click="login">
        <i class="icon-log-in" /> {{ $t('common.login') }}
      </a>
    </div>
  </div>
</template>

<script lang="ts" src="./Login.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/_colors";
@import "../styles/mixins";

.login__status {
  display: flex;
  align-items: center;

}
.user__profile {
  margin-right: 8px;
  display: flex;
  align-items: center;

  .user__thumbnail {
    display: flex;
    align-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    margin-right: 4px;
    opacity: .8;
    background-color: @text-secondary;
  }

  .user__name {
    display: inline-block;
    max-width: 160px;
    text-align: left;
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    .semibold;

  }
}
</style>
