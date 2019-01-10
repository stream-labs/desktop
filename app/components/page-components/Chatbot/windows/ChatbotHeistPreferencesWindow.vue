<template>
  <ModalLayout :showControls="false" :customControls="true" :containsTabs="true">
    <div slot="fixed">
      <div class="row">
      <div class="small-6 columns position--relative window-tab">
        <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTabHandler"></Tabs>
      </div>
      <div class="small-6 columns position--relative window-tab">
        <div class="window-toggle__wrapper">
          <div @click="onToggleHeistPreferencesWindowHandler">
            <span> {{ $t('Edit Command') }} </span>
            <i class="fas fa-chevron-right window-toggle__icon"></i>
          </div>
        </div>
      </div>
    </div>
    </div>
    <validated-form ref="form" slot="content" class="chatbot-symbol-protection__container">
      <div v-show="selectedTab === 'general'">
        <div class="section">
          <div class="section-content">
            <div class="row">
              <div class="columns small-4">
                <VFormGroup
                  :title="$t('Min. Entries')"
                  v-model="newHeistPreferences.settings.general.min_entries"
                  :metadata="metaData.minEntries"
                />
              </div>
              <div class="columns small-4">
                <VFormGroup
                  :title="$t('Max Amount')"
                  v-model="newHeistPreferences.settings.general.max_amount"
                  :metadata="metaData.maxAmount"
                />
              </div>
              <div class="columns small-4">
                <VFormGroup
                  :title="$t('Start Delay')"
                  v-model="newHeistPreferences.settings.general.start_delay"
                  :metadata="metaData.startDelay"
                />
              </div>
              <div class="columns small-4">
                <VFormGroup
                  :title="$t('Cooldown')"
                  v-model="newHeistPreferences.settings.general.cooldown"
                  :metadata="metaData.cooldown"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="section">
          <div class="section-content">
            <h2 class="section-title">{{$t('Chance to Win')}}</h2>
            <div class="row">
              <div class="columns small-4">
                <VFormGroup
                  :title="$t('Viewers')"
                  v-model="newHeistPreferences.settings.general.probability.viewers"
                  :metadata="metaData.viewersChance"
                />
              </div>
              <div class="columns small-4">
                <VFormGroup
                  :title="$t('Subscribers')"
                  v-model="newHeistPreferences.settings.general.probability.subscribers"
                  :metadata="metaData.subscribersChance"
                />
              </div>
              <div class="columns small-4">
                <VFormGroup
                  :title="$t('Moderators')"
                  v-model="newHeistPreferences.settings.general.probability.moderators"
                  :metadata="metaData.moderatorsChance"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="section">
          <div class="section-content">
            <h2 class="section-title">{{$t('Winner Payout')}}</h2>
            <div class="row">
              <div class="columns small-4">
                <VFormGroup
                  :title="$t('Viewers')"
                  v-model="newHeistPreferences.settings.general.payout.viewers"
                  :metadata="metaData.viewersPayout"
                />
              </div>
              <div class="columns small-4">
                <VFormGroup
                  :title="$t('Subscribers')"
                  v-model="newHeistPreferences.settings.general.payout.subscribers"
                  :metadata="metaData.subscribersPayout"
                />
              </div>
              <div class="columns small-4">
                <VFormGroup
                  :title="$t('Moderators')"
                  v-model="newHeistPreferences.settings.general.payout.moderators"
                  :metadata="metaData.moderatorsPayout"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-show="selectedTab === 'messages'">
        <div class="section">
          <div class="section-content">
            <h2 class="section-title">{{$t('Start Messages')}}</h2>
            <VFormGroup
              :title="$t('On First Entry')"
              v-model="newHeistPreferences.settings.messages.start.first"
              :metadata="metaData.firstEntry"
            />
            <VFormGroup
              :title="$t('On Successful Start')"
              v-model="newHeistPreferences.settings.messages.start.success"
              :metadata="metaData.successfulStart"
            />
            <VFormGroup
              :title="$t('On Failed Start')"
              v-model="newHeistPreferences.settings.messages.start.fail"
              :metadata="metaData.failedStart"
            />
          </div>
        </div>
        <div class="section">
          <h2 class="section-title">{{$t('Results')}}</h2>
          <VFormGroup
            :title="$t('Results')"
            v-model="newHeistPreferences.settings.messages.results"
            :metadata="metaData.results"
          />
        </div>
        <div class="section">
          <div class="section-content">
            <h2 class="section-title">{{$t('Solo Messages')}}</h2>
            <VFormGroup
              :title="$t('On Win')"
              v-model="newHeistPreferences.settings.messages.solo.win"
              :metadata="metaData.soloWin"
            />
            <VFormGroup
              :title="$t('On Loss')"
              v-model="newHeistPreferences.settings.messages.solo.loss"
              :metadata="metaData.soloLoss"
            />
          </div>
        </div>
        <div class="section">
          <div class="section-content">
            <h2 class="section-title">{{$t('Group Messages')}}</h2>
            <VFormGroup
              :title="$t('On Victory')"
              v-model="newHeistPreferences.settings.messages.group.win"
              :metadata="metaData.groupWin"
            />
            <VFormGroup
              :title="$t('On Partial Victory')"
              v-model="newHeistPreferences.settings.messages.group.partial"
              :metadata="metaData.groupPartial"
            />
            <VFormGroup
              :title="$t('On Defeat')"
              v-model="newHeistPreferences.settings.messages.group.loss"
              :metadata="metaData.groupLoss"
            />
          </div>
        </div>
        
      </div>
    </validated-form>
    <div slot="controls" class="flex flex--space-between">
      <button class="button button--default" @click="onResetHandler">{{ $t('Reset') }}</button>
      <div>
        <button class="button button--default" @click="onCancelHandler">{{ $t('Cancel') }}</button>
        <button
          class="button button--action"
          @click="onSaveHandler"
          :disabled="errors.items.length > 0"
        >{{ $t("Save") }}</button>
      </div>
    </div>
  </ModalLayout>
</template>

<script lang="ts" src="./ChatbotHeistPreferencesWindow.vue.ts"></script>

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
