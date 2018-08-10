<template>
<modal
  :name="NEW_ALERT_MODAL_ID"
  :height="'auto'"
  :maxHeight="600"
  @before-open="bindOnSubmitAndCheckIfEdited"
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
            v-model="newAlert.follow.newMessage.message"
            :metadata="metadata.follow.newMessage.message"
          />
        </div>
      </div>
      <div v-if="isSubscription">
        <div>
          <label for="tier" class="margin-vertical--10">Subscription Tier</label>
          <ListInput
            v-model="newAlert.sub.newMessage.tier"
            :metadata="metadata.sub.newMessage.tier"
          />
          <label for="months" class="margin-vertical--10">Subscription Months</label>
          <NumberInput
            v-model="newAlert.sub.newMessage.amount"
            :metadata="metadata.sub.newMessage.amount"
          />
          <label for="message" class="margin-vertical--10">Subscription Message</label>
          <TextAreaInput
            v-model="newAlert.sub.newMessage.message"
            :metadata="metadata.sub.newMessage.message"
          />
          <label for="tier" class="margin-vertical--10">Is Gifted</label>
          <ListInput
            v-model="newAlert.sub.newMessage.is_gifted"
            :metadata="metadata.sub.newMessage.is_gifted"
          />
        </div>
      </div>
      <div v-if="isDonation">
        <div>
          <label for="amount" class="margin-vertical--10">Donation Amount</label>
          <NumberInput
            v-model="newAlert.tip.newMessage.amount"
            :metadata="metadata.tip.newMessage.amount"
          />
          <label for="message" class="margin-vertical--10">Donation Message</label>
          <TextAreaInput
            v-model="newAlert.tip.newMessage.message"
            :metadata="metadata.tip.newMessage.message"
          />
        </div>
      </div>
      <div v-if="isHost">
        <div>
          <label for="min_viwers" class="margin-vertical--10">Minimum Viewers</label>
          <NumberInput
            v-model="newAlert.host.newMessage.amount"
            :metadata="metadata.host.newMessage.amount"
          />
          <label for="message" class="margin-vertical--10">Host Message</label>
          <TextAreaInput
            v-model="newAlert.host.newMessage.message"
            :metadata="metadata.host.newMessage.message"
          />
        </div>
      </div>
      <div v-if="isRaid">
        <div>
          <label for="amount" class="margin-vertical--10">Raider Amount</label>
          <NumberInput
            v-model="newAlert.raid.newMessage.amount"
            :metadata="metadata.raid.newMessage.amount"
          />
          <label for="message" class="margin-vertical--10">Raider Message</label>
          <TextAreaInput
            v-model="newAlert.raid.newMessage.message"
            :metadata="metadata.raid.newMessage.message"
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
        @click="submit">
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
