<template>
<div class="notifications-area" v-if="settings.enabled">
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

  <div class="counter warning"
     v-if="unreadCount"
     title="New Notifications"
     @click="showNotifications"
  >
    <span
      class="fa fa-warning"
    >
    </span>
    {{ unreadCount }}
  </div>

  <div class="counter"
       v-if="!unreadCount"
       title="Show Notifications"
       @click="showNotifications"
  >
    <span class="fa fa-info-circle"></span>
  </div>


</div>
</template>

<script lang="ts" src="./NotificationsArea.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.notifications-area {
  overflow: hidden;
  min-width: 300px;
  height: 43px;
}


.notification {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 30px;
  line-height: 30px;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  animation: notify-appears 0.3s;

  &.info {
    background-color: fade(@teal, 30%);
    color: @teal;
  }

  &.warning {
    background-color: fade(@red, 30%);
    color: @red;
  }

  &.has-action {
    cursor: pointer;
  };

  &.outdated {
    animation: notify-disappears 1s forwards;
  }
}


.counter {
  position: absolute;
  right: 5px;
  cursor: pointer;
  top: 6px;

  &.warning {
    color: @red;
    .fa {
      color: @red;
    }
  }
}

@keyframes notify-appears {
  from {opacity: 0; top: 50px}
  to {opacity: 1;}
}

@keyframes notify-disappears {
  from {opacity: 1}
  to {opacity: 0}
}

</style>
