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
      <div class="new-alert-modal__header__title">{{ title.split('_').join(' ') }}</div>
    </div>
    <validated-form ref="form">
      <div class="new-alert-modal__body">
        <div v-if="isFollower">
          <div>
            <VFormGroup
              :title="$t('Message')"
              type="text"
              v-model="newAlert.follow.newMessage.message"
              :metadata="metadata.follow.newMessage.message"
            />
          </div>
        </div>
        <div v-if="isSubscription">
          <div>
            <VFormGroup
              v-if="isTwitch"
              :title="$t('Subscription Tier')"
              v-model="newAlert.sub.newMessage.tier"
              :metadata="metadata.sub.newMessage.tier"
            />
            <VFormGroup
              :title="$t('Subscription Months')"
              v-if="!isYoutube"
              v-model="newAlert.sub.newMessage.amount"
              :metadata="metadata.sub.newMessage.amount"
            />
            <VFormGroup
              :title="$t('Subscription Message')"
              v-model="newAlert.sub.newMessage.message"
              :metadata="metadata.sub.newMessage.message"
            />
            <VFormGroup
              v-if="isTwitch"
              :title="$t('Is Gifted')"
              v-model="newAlert.sub.newMessage.is_gifted"
              :metadata="metadata.sub.newMessage.is_gifted"
            />
          </div>
        </div>
        <div v-if="isDonation">
          <div>
            <VFormGroup
              :title="$t('Donation Amount')"
              v-model="newAlert.tip.newMessage.amount"
              :metadata="metadata.tip.newMessage.amount"
            />
            <VFormGroup
              :title="$t('Donation Message')"
              v-model="newAlert.tip.newMessage.message"
              :metadata="metadata.tip.newMessage.message"
            />
          </div>
        </div>
        <div v-if="isHost">
          <div>
            <VFormGroup
              :title="$t('Minimum Viewers')"
              v-model="newAlert.host.newMessage.amount"
              :metadata="metadata.host.newMessage.amount"
            />
            <VFormGroup
              :title="$t('Host Message')"
              v-model="newAlert.host.newMessage.message"
              :metadata="metadata.host.newMessage.message"
            />
          </div>
        </div>
        <div v-if="isRaid">
          <div>
            <VFormGroup
              :title="$t('Raider Amount')"
              v-model="newAlert.raid.newMessage.amount"
              :metadata="metadata.raid.newMessage.amount"
            />
            <VFormGroup
              :title="$t('Raider Message')"
              v-model="newAlert.raid.newMessage.message"
              :metadata="metadata.raid.newMessage.message"
            />
          </div>
        </div>
        <div v-if="isBit">
          <div>
            <VFormGroup
              :title="$t('Minimum Bits')"
              v-model="newAlert.bits.newMessage.amount"
              :metadata="metadata.bits.newMessage.amount"
            />
            <VFormGroup
              :title="$t('Bit Donator Message')"
              v-model="newAlert.bits.newMessage.message"
              :metadata="metadata.bits.newMessage.message"
            />
          </div>
        </div>
        <div v-if="isSubMysteryGift">
          <div>
            <VFormGroup
              :title="$t('Subscription Tier')"
              v-model="newAlert.sub_mystery_gift.newMessage.tier"
              :metadata="metadata.sub_mystery_gift.newMessage.tier"
            />
            <VFormGroup
              :title="$t('Amount of Gifted Subs')"
              v-model="newAlert.sub_mystery_gift.newMessage.amount"
              :metadata="metadata.sub_mystery_gift.newMessage.amount"
            />
            <VFormGroup
              :title="$t('Subscription Message')"
              v-model="newAlert.sub_mystery_gift.newMessage.message"
              :metadata="metadata.sub_mystery_gift.newMessage.message"
            />
          </div>
        </div>
        <div v-if="isSponsor">
          <div>
            <VFormGroup
              :title="$t('Member Months')"
              v-model="newAlert.sponsor.newMessage.amount"
              :metadata="metadata.sponsor.newMessage.amount"
            />
            <VFormGroup
              :title="$t('Member Message')"
              v-model="newAlert.sponsor.newMessage.message"
              :metadata="metadata.sponsor.newMessage.message"
            />
          </div>
        </div>
        <div v-if="isSuperChat">
          <div>
            <VFormGroup
              :title="$t('Super Chat Amount')"
              v-model="newAlert.superchat.newMessage.amount"
              :metadata="metadata.superchat.newMessage.amount"
            />
            <VFormGroup
              :title="$t('Super Chat Message')"
              v-model="newAlert.superchat.newMessage.message"
              :metadata="metadata.superchat.newMessage.message"
            />
          </div>
        </div>
      </div>
    </validated-form>
    <div class="new-alert-modal__controls">
      <button
        class="button button--default"
        @click="onCancelHandler">
        {{ $t('Cancel') }}
      </button>
      <button
        class="button button--action"
        @click="onSubmit">
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
      .text-transform();
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
