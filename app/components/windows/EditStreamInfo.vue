<template>
  <modal-layout :show-controls="false" :customControls="true">
    <div slot="content">
      <h4 v-if="windowHeading">{{windowHeading}}</h4>
      <div v-if="infoLoading"><spinner/></div>
      <div v-if="infoError && !infoLoading" class="warning">
        {{ $t('There was an error fetching your channel information.  You can try') }}
        <a class="description-link" @click="populateInfo">{{
          $t('fetching the information again')
        }}</a
        >, {{ $t('or you can') }}
        <a class="description-link" @click="() => goLive(true)">{{ $t('just go live.') }}</a>
        {{ $t('If this error persists, you can try logging out and back in.') }}
      </div>
      <validated-form name="editStreamForm" ref="form" v-if="!infoLoading && !infoError">
        <div class="pages-warning" v-if="isFacebook && !hasPages">
          <i class="fab fa-facebook" />
          {{ $t('You must create a Facebook gaming page to go live.') }}
          <a class="description-link" @click="openFBPageCreateLink">{{
            $t('Create Page')
          }}</a>
        </div>
        <h-form-group
          v-if="isFacebook && hasPages && !midStreamMode"
          :v-model="channelInfo.facebookPageId"
          :metadata="formMetadata.page"
        />

        <div v-if="isYoutube">
          <YoutubeEditStreamInfo v-model="channelInfo" :canChangeBroadcast="!midStreamMode && !isSchedule"/>
        </div>
        <div v-else>
          <h-form-group
            v-model="channelInfo.title"
            :metadata="formMetadata.title"
          />
          <h-form-group
            v-if="isFacebook"
            v-model="channelInfo.description"
            :metadata="formMetadata.description"
          />
        </div>

        <h-form-group
          v-if="isTwitch || isMixer || isFacebook"
          :metadata="formMetadata.game"
        >
          <list-input
            @search-change="value => onGameSearchHandler(value)"
            @input="onGameInput"
            v-model="channelInfo.game"
            :metadata="formMetadata.game"
          />
        </h-form-group>
        <TwitchTagsInput
          v-if="isTwitch"
          v-model="channelInfo.tags"
          :tags="channelInfo.availableTags"
          name="tags"
          :has-permission="hasUpdateTagsPermission"
        />
        <h-form-group v-if="searchProfilesPending">
          {{ $t('Checking optimized setting for') }} {{ channelInfo.game }}...
        </h-form-group>
        <div v-if="isSchedule">
          <h-form-group type="text" v-model="startTimeModel.date" :metadata="formMetadata.date" />
          <h-form-group type="timer" v-model="startTimeModel.time" :metadata="formMetadata.time" />
        </div>
        <div
          v-if="selectedProfile"
          :class="{ profile: true, 'profile-default': selectedProfile.game === 'DEFAULT' }"
        >
          <h-form-group
            v-if="isTwitch || isYoutube"
            :metadata="{
              tooltip: $t(
                'Optimized encoding provides better quality and/or lower cpu/gpu usage. Depending on the game, resolution may be changed for a better quality of experience',
              ),
            }"
          >
            <bool-input v-model="useOptimizedProfile" :metadata="optimizedProfileMetadata" />
          </h-form-group>
        </div>
        <h-form-group v-if="!midStreamMode && !isFacebook">
          <bool-input
            v-model="doNotShowAgainModel"
            name="do_not_show_again"
            :metadata="{ title: $t('Do not show this message when going live') }"
          />
        </h-form-group>
        <Twitter
          :streamTitle="channelInfo.title"
          :midStreamMode="midStreamMode"
          :updatingInfo="updatingInfo"
          v-if="twitterIsEnabled && !isSchedule"
          v-model="tweetModel"
        />

        <div class="update-warning" v-if="updateError">
          <div v-if="midStreamMode">
            {{ $t('Something went wrong while updating your stream info.  Please try again.') }}
          </div>
          <div v-else>
            {{
              $t(
                'Something went wrong while updating your stream info. You can try again, or you can',
              )
            }}
            <a @click="goLive(true)">{{ $t('just go live') }}</a
            >
          </div>
        </div>
      </validated-form>
    </div>
    <div slot="controls" class="controls">
      <button class="button button--default" :disabled="updatingInfo" @click="cancel">
        {{ isSchedule ? $t('Close') : $t('Cancel') }}
      </button>
      <button
        class="button button--action"
        :disabled="infoLoading || updatingInfo || (isFacebook && !hasPages)"
        @click="handleSubmit"
      >
        <i class="fa fa-spinner fa-pulse" v-if="updatingInfo" /> {{ submitText }}
      </button>
    </div>
  </modal-layout>
</template>

<script lang="ts" src="./EditStreamInfo.vue.ts"></script>

<style lang="less" scoped>
@import '../../styles/index';

.update-warning {
  .warning();
}

.pages-warning {
  .radius();

  height: 40px;
  width: 100%;
  display: flex;
  justify-content: space-around;
  background-color: var(--teal-semi);
  align-items: center;
  color: var(--teal);
  margin-bottom: 16px;

  a {
    color: var(--teal);
  }
}

.description-link {
  text-decoration: underline;
  font-weight: 600;
}

.edit-stream-info-option-desc {
  height: 20px;
  line-height: 20px;
}

.edit-stream-info-option-longdesc {
  height: 13px;
  line-height: 13px;
  font-size: 11px;
  color: var(--paragraph);
}
</style>
