<template>
<modal-layout
    title="Notifications"
    :showControls="false"
>
  <div slot="content">

    <div v-for="(notifications, groupName) in notificationGroups">
      <h4 v-if="notifications.length">
        {{ groupName == 'unread' ? 'New Notifications' : 'Log' }}
      </h4>
      <div
        class="notification"
        v-for="notify in notifications"
        @click="onNotificationClickHandler(notify.id)"
        :class = "{
          'unread': notify.unread,
          'has-action': notify.action
        }"
      >
        <div class="icon">
          <span class="fa fa-info-circle" v-if="notify.type == 'INFO'"></span>
          <span class="fa fa-warning" v-if="notify.type == 'WARNING'"></span>
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

  @import "../../styles/index";


  .notification {
    color: @grey;
    padding: 5px 10px;
    margin-bottom: 5px;
    display: grid;
    grid-template-columns: 30px 1fr 130px;
    background: @night-hover;
    border-color: @night-hover;


    &.has-action:hover {
      color: @white;
      border-color: @night-secondary;
      background: @night-secondary;
      cursor: pointer;
    }

    &:last-child { margin-bottom: 20px;}
    .fa-warning { color: @red; }
    .fa-info-circle { color: @teal; }
    .date { text-align: right;}
  }

</style>
