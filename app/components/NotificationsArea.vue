<template>
<div class="notifications-area" v-if="settings.enabled">
  <div
    class="notifications__counter notifications__counter--warning"
    v-if="unreadCount"
    title="New Notifications"
    @click="showNotifications">
    <span class="fa fa-exclamation-triangle"></span>
    {{ unreadCount }}
  </div>

  <div
    class="notifications__counter"
    v-if="!unreadCount"
    title="Show Notifications"
    @click="showNotifications">
    <span class="fa fa-info-circle"></span>
  </div>

  <div
    v-for="notify in notifications"
    class="notification"
    @click="onNotificationClickHandler(notify.id)"
    :class="{
      'info': notify.type == 'INFO',
      'warning': notify.type == 'WARNING',
      'has-action': notify.action && !notify.outdated,
      'outdated': notify.outdated
    }"
  >
    {{ notify.message }}
  </div>
</div>
</template>

<script lang="ts" src="./NotificationsArea.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.notifications-area {
  overflow: hidden;
  min-width: 300px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.notification {
  height: 30px;
  line-height: 30px;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  margin-left: 10px;
  animation: notify-appears 0.3s;

  &.info {
    background-color: fade(@grey, 15%);
    color: @grey;
  }

  &.warning {
    background-color: fade(@red, 20%);
    color: @red;
  }

  &.has-action {
    cursor: pointer;
  }

  &.outdated {
    animation: notify-disappears 1s forwards;
    display: none;
  }
}

.notifications__counter {
  cursor: pointer;

  &:before {
    content: '|';
    padding-right: 12px;
    opacity: .5;
    color: @grey;
  }

  .fa {
    font-size: 15px;
  }
}

.notifications__counter--warning {
  color: @red;

  .fa {
    color: @red;
  }
}

@keyframes notify-appears {
  from {opacity: 0; top: 50px}
  to {opacity: 1;}
}

@keyframes notify-disappears {
  from {opacity: 1}
  to {opacity: 0;}
}

</style>
