
<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Media Share Preferences')"
>
  <div slot="fixed">
    <div class="row">
      <div class="small-6 columns position--relative window-tab">
        <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTabHandler"></Tabs>
      </div>
      <div class="small-6 columns position--relative window-tab">
        <div class="window-toggle__wrapper">
          <div @click="onToggleSongRequestWindowHandler">
            <span> {{ $t('Edit Primary Command') }} </span>
            <i class="fas fa-chevron-right window-toggle__icon"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div slot="content" class="chatbot-song-request__container">
    <validated-form ref="form">
      <div v-if="songRequestData">
        <transition name='fade' mode="out-in" appear>
          <div v-if="selectedTab === 'general' && !!songRequestData.general">
            <VFormGroup
              :title="$t('Max Duration (Value in Seconds)')"
              v-model="songRequestData.general.max_duration"
              :metadata="metadata.general.max_duration"
            />
            <VFormGroup
              :title="$t('Spam Security')"
              v-model="songRequestData.general.filter_level"
              :metadata="metadata.general.filter_level"
            />
          </div>
          <div v-else>
            <table v-if="songRequestBannedMedia.length > 0">
              <thead>
                <tr>
                  <th> {{ $t('Video') }} </th>
                  <th> {{ $t('Banned By') }} </th>
                  <th> {{ $t('Unban') }} </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="media in songRequestBannedMedia"
                  :key="media.id"
                >
                  <td> {{ media.media_title }} </td>
                  <td> {{ media.action_by }} </td>
                  <td>
                    <button
                      @click="onUnbanMediaHandler(media)"
                      class="button button--default"
                    >{{ $t('Unban') }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="chatbot-empty-placeholder__container">
              <img
                :src="require(`../../../../../media/images/chatbot/chatbot-placeholder-blacklist--${this.nightMode ? 'night' : 'day'}.svg`)"
                width="200"
              />
              {{ $t('No items in list. Add new.') }}
            </div>
          </div>
        </transition>
      </div>
    </validated-form>
  </div>
  <div slot="controls" class="flex flex--space-between">
    <div>
      <button
        class="button button--default"
        @click="onCancelHandler">
        {{ $t('Cancel') }}
      </button>
      <button
        class="button button--action"
        @click="onSaveHandler"
      >
        {{ $t("Save") }}
      </button>
    </div>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotSongRequestPreferencesWindow.vue.ts"></script>

<style lang="less" scoped>
@import "../../../../styles/index";
.window-tab {
  &:first-child {
    padding-right: 0;
  }
  &:last-child {
    padding-left: 0;
  }
}
.chatbot-empty-placeholder__container {
  .flex();
  .flex--column();
  .flex--center();
  .padding-vertical--20;
}
.window-toggle__wrapper {
  background-color: @day-primary;
  z-index: 1;
  width: 100%;
  padding: 15px;
  height: 54px;
  border-bottom: 1px solid @day-border;
  cursor: pointer;
  text-align: right;

  .window-toggle__icon {
    .margin-left();
  }
}

.chatbot-song-request__container {
  padding-top: 45px;
}

.night-theme {
  .window-toggle__wrapper {
    background-color: @night-primary;
    border-color: @night-border;
  }
}
</style>