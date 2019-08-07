<template>
  <modal-layout :show-controls="false" :customControls="true">
    <div slot="content">
      <div v-if="infoLoading"><spinner/></div>

      <div v-if="infoError && !infoLoading" class="warning">
        {{ $t('There was an error fetching your channel information.  You can try') }}
        <a class="description-link" @click="refreshStreamInfo">{{
          $t('fetching the information again')
        }}</a
        >, {{ $t('or you can') }}
        <a class="description-link" @click="goLive">{{ $t('just go live.') }}</a>
        {{ $t('If this error persists, you can try logging out and back in.') }}
      </div>
      <validated-form name="editStreamForm" ref="form" v-if="!infoLoading && !infoError">
        <div class="pages-warning" v-if="isFacebook && !hasPages">
          {{ $t("It looks like you don't have any Pages. Head to ") }}
          <a class="description-link" @click="openFBPageCreateLink">{{
            $t('Facebook Page Creation')
          }}</a>
          {{ $t(' to create a page, and then try again.') }}
        </div>
        <h-form-group
          v-if="isFacebook && hasPages && !midStreamMode"
          :v-model="channelInfo.facebookPageId"
          :metadata="{
            type: 'list',
            name: 'stream_page',
            title: $t('Facebook Page'),
            options: facebookService.state.facebookPages.options,
          }"
        />
        <h-form-group
          v-model="channelInfo.title"
          :metadata="formMetadata.title"
        />
        <h-form-group
          v-if="isYoutube || isFacebook"
          v-model="channelInfo.description"
          :metadata="formMetadata.description"
        />
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
        <h-form-group v-if="!midStreamMode && !updatingInfo && !hasTwitter">
          <div class="section">
            <p class="twitter-share-text">{{ $t('Share Your Stream') }}</p>
            <p>{{ $t('Tweet to let your followers know you\'re going live') }}</p>
            <button class="button button--default" :disabled="updatingInfo" @click="linkTwitter">
              {{ $t('Connect to Twitter') }} <i class="fab fa-twitter"></i>
            </button>
          </div>
        </h-form-group>
        <h-form-group v-if="!midStreamMode && hasTwitter">
          <div class="section">
            <p class="twitter-share-text">{{ $t('Share Your Stream') }}</p>
            <div class="twitter-row">
              <div class="twitter-toggle-block">
                <span>{{ $t('Enable Tweet Sharing') }}</span>
                <toggle-input
                  v-model="shouldTweetModel"
                  name="shouldTweet"
                  class="twitter-tweet-toggle"
                  :metadata="{ title: $t('Tweet when going live') }"
                />
              </div>
              <p>@{{ twitterScreenName }}</p>
            </div>
            <text-area
              name="tweetInput"
              v-model="tweetModel"
              autoResize="true"
              :label="composeTweetText"
              class="twitter-tweet-input"
              placeholder="Come check out my stream"
              :maxLength="280"
              :maxHeight="100"
              slot="input"
            ></text-area>
            <div class="twitter-buttons">
              <Button
                v-if="!isPrime"
                :type="'button'"
                :size="'small'"
                :variation="'prime'"
                :title="primeButtonText"
                @click="openPrime">
              </Button>
              <button class="button button--default margin-right-0 margin-left-10" :disabled="updatingInfo" @click="unlinkTwitter">
                {{ $t('Unlink Twitter') }}
              </button>
            </div>
          </div>
        </h-form-group>
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
            <a @click="goLive">{{ $t('just go live') }}</a
            >
          </div>
        </div>
      </validated-form>
    </div>
    <div slot="controls">
      <button class="button button--default" :disabled="updatingInfo" @click="cancel">
        {{ isSchedule ? $t('Close') : $t('Cancel') }}
      </button>
      <button
        class="button button--action"
        :disabled="updatingInfo || (isFacebook && !hasPages)"
        @click="handleSubmit"
      >
        <i class="fa fa-spinner fa-pulse" v-if="updatingInfo" /> {{ submitText }}
      </button>
    </div>
  </modal-layout>
</template>

<script lang="ts" src="./EditStreamInfo.vue.ts"></script>

<style lang="less">
@import '../../styles/index';

.twitter-tweet-input {
  textarea, .s-form-area__label {
    background: var(--section-alt);
  }
}

.night-theme {
  .twitter-tweet-input {
    .s-form-area__label {
      background: var(--section-alt);
    }
  }
}
</style>

<style lang="less" scoped>
@import '../../styles/index';

.section {
  background: var(--section-alt);
}

.twitter-share-text {
  font-size: 16px;
  margin-bottom: 6px;
}

.twitter-buttons {
  margin-top: 6px;
  display: inline-flex;
  width: 100%;
  justify-content: flex-end;
}

.margin-right-0 {
  margin-right: 0;
}

.margin-left-10 {
  margin-left: 10px;
}

.twitter-row {
  display: inline-flex;
  width: 100%;
  justify-content: space-between;
  align-items: end;
  font-size: 12px;

  .button {
    margin-right: 0px;
  }
}

.twitter-tweet-toggle {
  margin-left: 12px;
}

.twitter-toggle-block {
  display: inline-flex;
  align-items: center;
}

.pages-warning,
.update-warning {
  .warning();
}

.description-link {
  text-decoration: underline;
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
