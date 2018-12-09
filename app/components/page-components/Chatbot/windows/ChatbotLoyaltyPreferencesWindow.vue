<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
>
  <div slot="fixed">
    <div class="row">
      <div class="small-6 columns position--relative window-tab">
        <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTabHandler"></Tabs>
      </div>
      <div class="small-6 columns position--relative window-tab">
        <div class="window-toggle__wrapper">
          <div @click="onToggleLoyaltyPreferencesWindowHandler">
            <span> {{ $t('Edit Command') }} </span>
            <i class="fas fa-chevron-right window-toggle__icon"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div slot="content" class="chatbot-loyalty-preferences__container">
    <div class="loyalty-tabs">
      <validated-form ref="form">
        <div class="loyalty-tabs__general" v-show="selectedTab === 'general'">
          <div class="section">
            <div class="section-content">
            <BoolInput
              :title="$t('Loyalty Enabled')"
              v-model="newLoyaltyPreferences.enabled"
            />
            <VFormGroup
              :title="$t('Loyalty Name')"
              v-model="newLoyaltyPreferences.settings.general.name"
              :metadata="loyaltyNameMetaData"
            />
            </div>
          </div>
          <div class="section">
            <div class="section-content">
             <div class="flex flex--space-between loyalty-flex__underline">
                <h2 class="section-title">{{$t('Points Per Hour')}}</h2>
                <div>       
                  <span>{{ $t('Min:') }} {{ $t(minAmount) }} {{ $t(' - ') }} {{ $t('Max: ') }} {{ $t(maxAmount) }}</span>
                </div>
              </div>
              <VFormGroup
                :title="$t('Interval (Value in Minutes)')"
                v-model="newLoyaltyPreferences.settings.general.interval.live"
                :metadata="liveIntervalMetaData"
              />
              <h2 class="section-title">{{$t('Points Payout')}}</h2>
              <div class="row">
                <div class="columns small-6">
                  <VFormGroup
                    :title="$t('Live')"
                    v-model="newLoyaltyPreferences.settings.general.payout.live"
                    :metadata="livePayoutMetaData"
                  />
                </div>
                <div class="columns small-6">
                  <VFormGroup
                    :title="$t('Active')"
                    v-model="newLoyaltyPreferences.settings.general.payout.active"
                    :metadata="activePayoutMetaData"
                  />
                </div>
              </div>
            </div>
          </div> 
        </div>
        <div class="loyalty-tabs__advanced" v-show="selectedTab === 'advanced'">
          <div class="section">
            <div class="section-content">
              <h2 class="section-title">{{$t('Event Payout')}}</h2>
              <div class="row">
                <div class="columns small-4">
                  <VFormGroup
                    :title="$t('On Follow')"
                    v-model="newLoyaltyPreferences.settings.advanced.event.on_follow"
                    :metadata="onFollowMetaData"
                  />
                </div>
                <div class="columns small-4">
                  <VFormGroup
                    :title="$t('On Sub')"
                    v-model="newLoyaltyPreferences.settings.advanced.event.on_sub"
                    :metadata="onSubMetaData"
                  />
                </div>
                <div class="columns small-4">
                  <VFormGroup
                    :title="$t('On Host')"
                    v-model="newLoyaltyPreferences.settings.advanced.event.on_host"
                    :metadata="onHostMetaData"
                  />
                </div>
                <div class="columns small-4">
                  <VFormGroup
                    :title="$t('On Raid')"
                    v-model="newLoyaltyPreferences.settings.advanced.event.on_raid"
                    :metadata="onRaidMetaData"
                  />
                </div>
              </div>
            </div>
          </div> 
          <div class="section">
            <div class="section-content">
              <h2 class="section-title">{{$t('Donations (Points per 1 USD/EUR/...)')}}</h2>
              <div class="row">
                <div class="columns small-4">
                  <VFormGroup
                    :title="$t('Streamlabs')"
                    v-model="newLoyaltyPreferences.settings.advanced.donations.streamlabs"
                    :metadata="onStreamlabsMetaData"
                  />
                </div>
                <div class="columns small-4">
                  <VFormGroup
                    :title="$t('Extra Life')"
                    v-model="newLoyaltyPreferences.settings.advanced.donations.extralife"
                    :metadata="onExtraLifeMetaData"
                  />
                </div>
                <div class="columns small-4">
                  <VFormGroup
                    :title="$t('Super Chat')"
                    v-model="newLoyaltyPreferences.settings.advanced.donations.superchat"
                    :metadata="onSuperChatMetaData"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="loyalty-tabs__import" v-show="selectedTab === 'import'">
        </div>
      </validated-form>
    </div>
  </div>
  <div slot="controls" class="flex flex--space-between">
    <div></div>
    <div>
      <button
        class="button button--default"
        @click="onCancelHandler">
        {{ $t('Cancel') }}
      </button>
      <button
        class="button button--action"
        @click="onSaveHandler"
        :disabled="errors.items.length > 0"
      >
        {{ $t("Save") }}
      </button>
    </div>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotLoyaltyPreferencesWindow.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';
.window-tab {
  &:first-child {
    padding-right: 0;
  }
  &:last-child {
    padding-left: 0;
  }
}

.window-toggle__wrapper {
  background-color: @day-primary;
  z-index: 1;
  width: 100%;
  padding: 15px;
  padding-left: 0px;
  height: 48px;
  border-bottom: 1px solid @day-border;
  cursor: pointer;
  text-align: right;

  .window-toggle__icon {
    .margin-left();
  }
}

.chatbot-loyalty-preferences__container {
  padding-top: 45px;
}

.section-title {
  .margin-bottom();
}

.loyalty-flex__underline {
  border-bottom-color: @day-border;
  border-bottom-width: 1px;
  border-bottom-style: solid;
  .margin-bottom(2);
}

.night-theme {
  .window-toggle__wrapper {
    background-color: @night-primary;
    border-color: @night-border;
  }
  .loyalty-flex__underline {
    border-bottom-color: @night-border;
    border-bottom-width: 1px;
    border-bottom-style: solid;
    .margin-bottom(2);
  }
}
</style>
