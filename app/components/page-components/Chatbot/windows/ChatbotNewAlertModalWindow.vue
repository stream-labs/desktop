<template>
<modal
  name='new-alert'
  :height="'auto'"
  :maxHeight="600"
>
  <div class="new-alert-modal">
    <div class="new-alert-modal__header">
      <img class="new-alert-modal__header__icon" src="../../../../../media/images/icon.ico" />
      <div class="new-alert-modal__header__title">{{ $t(title) }}</div>
    </div>
    <div class="new-alert-modal__body">
      <div v-if="isFollower">
        <div>
          <label for="message" class="margin-vertical--10">Message</label>
          <TextAreaInput
            v-model="newAlert.followers.newMessage"
            :metadata="metadata.followers.newMessage"
          />
        </div>
      </div>
      <div v-if="isSubscription">
        <div>
          <label for="tier" class="margin-vertical--10">Subscription Tier</label>
          <ListInput
            v-model="newAlert.subscriptions.newMessage.tier"
            :metadata="metadata.subscriptions.newMessage.tier"
          />
          <label for="months" class="margin-vertical--10">Subscription Months</label>
          <NumberInput
            v-model="newAlert.subscriptions.newMessage.months"
            :metadata="metadata.subscriptions.newMessage.months"
          />
          <label for="message" class="margin-vertical--10">Subscription Message</label>
          <TextAreaInput
            v-model="newAlert.subscriptions.newMessage.message"
            :metadata="metadata.subscriptions.newMessage.message"
          />
          <label for="tier" class="margin-vertical--10">Is Gifted</label>
          <ListInput
            v-model="newAlert.subscriptions.newMessage.is_gifted"
            :metadata="metadata.subscriptions.newMessage.is_gifted"
          />
        </div>
      </div>
      <div v-if="isDonation">
        <div>
          <label for="amount" class="margin-vertical--10">Donation Amount</label>
            <!-- v-model="newAlert.donations.newMessage.amount" -->
          <NumberInput
            @input="(data) => {
              debugger;
            }"
            :value="newAlert.donations.newMessage.amount"
            :metadata="metadata.donations.newMessage.amount"
          />
          <label for="message" class="margin-vertical--10">Donation Message</label>
          <TextAreaInput
            v-model="newAlert.donations.newMessage.message"
            :metadata="metadata.donations.newMessage.message"
          />
        </div>
      </div>
      <div v-if="isHost">
        <div>
          <label for="min_viwers" class="margin-vertical--10">Minimum Viewers</label>
          <NumberInput
            v-model="newAlert.hosts.newMessage.min_viewers"
            :metadata="metadata.hosts.newMessage.min_viewers"
          />
          <label for="message" class="margin-vertical--10">Host Message</label>
          <TextAreaInput
            v-model="newAlert.hosts.newMessage.message"
            :metadata="metadata.hosts.newMessage.message"
          />
        </div>
      </div>
      <div v-if="isRaid">
        <div>
          <label for="amount" class="margin-vertical--10">Raider Amount</label>
          <NumberInput
            v-model="newAlert.raids.newMessage.amount"
            :metadata="metadata.raids.newMessage.amount"
          />
          <label for="message" class="margin-vertical--10">Raider Message</label>
          <TextAreaInput
            v-model="newAlert.raids.newMessage.message"
            :metadata="metadata.raids.newMessage.message"
          />
        </div>
      </div>
    </div>
    <div class="new-alert-modal__controls">
      <button
        class="button button--default"
        @click="cancel">
        {{ $t('Cancel') }}
      </button>
      <button
        class="button button--action"
        @click="done">
        {{ $t('Done') }}
      </button>
    </div>
  </div>
</modal>
</template>
<script lang="ts" src="./ChatbotNewAlertModalWindow.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";
.new-alert-modal {
  .new-alert-modal__header {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 30px;
    border-bottom: 1px solid @day-border;

    .new-alert-modal__header__icon {
      padding-left: 10px;
      width: 32px;
    }

    .new-alert-modal__header__title {
      .text-transform--capitalize();
      flex-grow: 1;
      padding-left: 10px;
    }
  }

  .new-alert-modal__body {
    .padding--20();
  }

  .new-alert-modal__controls {
    background-color: @day-secondary;
    border-top: 1px solid @day-border;
    padding: 10px 20px;
    text-align: right;
    flex-shrink: 0;
    z-index: 10;

    .button {
      margin-left: 8px;
    }
  }
}


.night-theme {
  .new-alert-modal {
    .new-alert-modal__header {
      border-bottom: 1px solid @night-border;
    }

    .new-alert-modal__controls {
      border-top-color: @night-border;
      background-color: @night-primary;
    }
  }

}


</style>
