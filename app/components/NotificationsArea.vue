<template>
<div class="notifications-area" v-if="settings.enabled">
  <div
    class="notifications__counter notifications__counter--warning"
    v-if="unreadCount"
    v-tooltip="showUnreadNotificationsTooltip"
    @click="showNotifications">
    <span class="icon-warning"></span>
    {{ unreadCount }}
  </div>

  <div
    class="notifications__counter"
    v-if="!unreadCount"
    @click="showNotifications"
    v-tooltip="showNotificationsTooltip">
    <span class="icon-information"></span>
  </div>

  <div class="notifications__container flex--grow" ref="notificationsContainer">
    <div
      v-for="notify in notifications"
      class="notification"
      v-show="showExtendedNotifications"
      @click="onNotificationClickHandler(notify.id)"
      :class="{
        'info': notify.type == 'INFO',
        'warning': notify.type == 'WARNING',
        'has-action': notify.action && !notify.outdated,
        'outdated': notify.outdated,
        'success': notify.type == 'SUCCESS',
      }"
    >
      {{ notify.message }} <span v-if="notify.showTime"> {{ moment(notify.date) }} </span>
    </div>
  </div>

</div>
</template>

<script lang="ts" src="./NotificationsArea.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/_colors";

.notifications-area {
  overflow: hidden;
  min-width: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.notifications__container {
  position: relative;
  height: 30px;
}

.notification {
  height: 30px;
  max-width: 100%;
  line-height: 30px;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: absolute;
  animation: notify-appears 0.3s;


  &.info {
    background-color: fade(@text-primary, 15%);
    color: @text-primary;
  }

  &.warning {
    background-color: fade(@red, 20%);
    color: @red;
  }

  &.success {
    background-color: fade(@accent, 20%);
    color: @accent;
  }

  &.has-action {
    cursor: pointer;
  }

  &.outdated {
    animation: notify-disappears 1s forwards;
  }
}

.notifications__counter {
  cursor: pointer;
  white-space: nowrap;
  margin-right: 10px;

  &:before {
    content: '|';
    padding-right: 12px;
    opacity: .5;
    color: @text-primary;
  }

  .icon-warning {
    font-size: 15px;
  }
}

.notifications__counter--warning {
  color: @red;

  i {
    color: @red;
  }
}

@keyframes notify-appears {
  from {opacity: 0; top: 50px}
  to {opacity: 1; top: 0 }
}

@keyframes notify-disappears {
  from {opacity: 1}
  to {opacity: 0; display: none}
}

</style>
