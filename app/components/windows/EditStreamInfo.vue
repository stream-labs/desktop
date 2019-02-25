<template>
  <modal-layout :show-controls="false" :customControls="true">
    <div slot="content">
      <div v-if="infoLoading || populatingModels"><i class="fa fa-spinner fa-pulse" /></div>
      <div v-if="infoError && !infoLoading" class="warning">
        {{ $t('There was an error fetching your channel information.  You can try') }}
        <a class="description-link" @click="refreshStreamInfo">{{
          $t('fetching the information again')
        }}</a
        >, {{ $t('or you can') }}
        <a class="description-link" @click="goLive">{{ $t('just go live.') }}</a>
        {{ $t('If this error persists, you can try logging out and back in.') }}
      </div>
      <div v-if="!infoLoading && !infoError && !populatingModels">
        <div class="pages-warning" v-if="isFacebook && !hasPages">
          {{ $t("It looks like you don't have any Pages. Head to ") }}
          <a class="description-link" @click="openFBPageCreateLink">{{
            $t('Facebook Page Creation')
          }}</a>
          {{ $t(' to create a page, and then try again.') }}
        </div>
        <h-form-group
          v-if="isFacebook && hasPages && !midStreamMode"
          :value="pageModel"
          @input="pageId => setFacebookPageId(pageId)"
          :metadata="{
            type: 'list',
            name: 'stream_page',
            title: $t('Facebook Page'),
            options: pageOptions,
          }"
        />
        <h-form-group
          v-model="streamTitleModel"
          :metadata="{ type: 'text', name: 'stream_title', title: $t('Title'), fullWidth: true }"
        />
        <h-form-group
          v-if="isYoutube || isFacebook"
          v-model="streamDescriptionModel"
          :metadata="{
            type: 'text-area',
            name: 'stream_description',
            title: $t('Description'),
            rows: 4,
          }"
        />
        <h-form-group
          v-if="isTwitch || isMixer || isFacebook"
          :title="$t('Game')"
          name="stream_game"
        >
          <list-input
            @search-change="debouncedGameSearch"
            @input="onGameInput"
            :value="gameModel"
            :metadata="gameMetadata"
          />
        </h-form-group>
        <TwitchTagsInput
          v-if="isTwitch"
          v-model="twitchTags"
          :tags="allTwitchTags"
          :has-permission="hasUpdateTagsPermission"
          @input="setTags"
        />
        <h-form-group v-if="searchProfilesPending">
          {{ $t('Checking optimized setting for') }} {{ gameModel }}...
        </h-form-group>
        <div v-if="isSchedule">
          <h-form-group type="text" v-model="startTimeModel.date" :metadata="dateMetadata" />
          <h-form-group type="timer" v-model="startTimeModel.time" :metadata="timeMetadata" />
        </div>
        <div v-if="selectedProfile">
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
            >.
          </div>
        </div>
      </div>
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

<style lang="less" scoped>
@import '../../styles/index';

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
  color: @grey;
}

.night-theme {
  .edit-stream-info-option-longdes {
    color: @night-paragraph;
  }
}
</style>
