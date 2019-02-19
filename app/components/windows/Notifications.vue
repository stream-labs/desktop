<template>
<modal-layout
    :title="$t('common.notifications')"
    :showControls="false"
>
  <div slot="content">

    <h4 v-if="!notificationsCount">
      {{ $t('notifications.noNotification') }}
    </h4>

    <div v-for="(notificationsService, groupName) in notificationGroups">
      <h4 v-if="notificationsService.length">
        {{ groupName == 'unread' ? $t('notifications.newNotifications') : $t('notifications.log') }}
      </h4>
      <div
        class="notification"
        v-for="notify in notificationsService"
        @click="onNotificationClickHandler(notify.id)"
        :class = "{
          'unread': notify.unread,
          'has-action': notify.action
        }"
      >
        <div class="icon">
          <span class="icon-notification" v-if="notify.type == 'INFO'"></span>
          <span class="icon-warning" v-if="notify.type == 'WARNING'"></span>
        </div>
        <div class="message">{{ notify.message }}</div>
        <div class="date">{{ moment(notify.date) }}</div>

      </div>
    </div>
  </div>

</modal-layout>
</template>

<script lang="ts" src="./Notifications.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/_colors";
@import "../../styles/mixins";

.notification {
  color: @text-primary;
  padding: 5px 10px;
  margin-bottom: 5px;
  display: grid;
  grid-template-columns: 30px 1fr 130px;
  background: @hover;
  border-color: @hover;
  .border;

  &.has-action:hover {
    color: @white;
    border-color: @bg-secondary;
    background: @bg-secondary;
    cursor: pointer;
  }

  &:last-child {
    margin-bottom: 20px;
  }

  .icon-warning {
    color: @red;
  }
  .icon-notification,
  .icon-warning {
    margin-right: 4px;
  }

  .date {
    text-align: right;
  }
}

</style>
