<template>
<modal-layout
  :show-controls="false"
  :customControls="true">
  <div slot="content">
    <div v-if="infoLoading || populatingModels">
      <i class="fa fa-spinner fa-pulse" />
    </div>
    <div v-if="infoError && !infoLoading" class="warning">
      {{ $t('There was an error fetching your channel information.  You can try') }}
      <a class="description-link" @click="refreshStreamInfo">{{ $t('fetching the information again') }}</a>,
      {{ $t('or you can') }}
      <a class="description-link" @click="goLive">{{ $t('just go live.') }}</a>
      {{ $t('If this error persists, you can try logging out and back in.') }}
    </div>
    <div v-if="!infoLoading && !infoError && !populatingModels">
      <div class="warning" v-if="isFacebook && !hasPages">
        {{ $t('It looks like you don\'t have any Pages. Head to ') }}
        <a class="description-link" @click="openFBPageCreateLink">{{ $t('Facebook Page Creation') }}</a>
        {{ $t(' to create a page, and then try again.') }}
      </div>
      <ObsListInput
        v-if="isFacebook && hasPages && !midStreamMode"
        :value="pageModel"
        @input="(pageId) => setFacebookPageId(pageId)"
      />
      <h-form-group v-model="streamTitleModel" :metadata="{ type: 'text', name: 'stream_title', title: $t('Title') }" />
      <h-form-group
        v-if="isYoutube || isFacebook"
        v-model="streamDescriptionModel"
        :metadata="{ type: 'text-area', name: 'stream_description', title: $t('Description'), rows: 4 }"
      />
      <ObsListInput
        v-if="isTwitch || isMixer || isFacebook"
        :value="gameModel"
        :allowEmpty="true"
        placeholder="Search"
        :internal-search="false"
        :loading="searchingGames"
        @search-change="debouncedGameSearch"
        @input="onGameInput"/>
      <ObsListInput v-if="isFacebook" :value="pageModel" @input="(pageId) => setFacebookPageId(pageId)" />

      <h-form-group v-if="searchProfilesPending">
        {{ $t('Checking optimized setting for') }} {{ gameModel.value }}...
      </h-form-group>

      <div v-if="isSchedule">
        <h-form-group type="text" v-model="startTimeModel.date" :metadata="dateMetadata" />
        <h-form-group type="timer" v-model="startTimeModel.time" :metadata="timeMetadata" />
      </div>
      <div v-if="selectedProfile">
        <div class="input-container" v-if="isTwitch || isYoutube">
          <div class="input-label"/>
          <div class="input-wrapper">
            <div class="checkbox">
              <div>
                <input
                  type="checkbox"
                  v-model="useOptimizedProfile"
                />
                <label>
                  <span>
                    {{ $t('Use optimized encoder settings for') }}
                    {{ selectedProfile.game !== 'DEFAULT' ? selectedProfile.game : selectedProfile.encoder }}
                  </span>
                  <span>
                    <i class="tooltip-trigger fa fa-question-circle has-tooltip"
                      style="font-size:15px;whitespace: nowrap;"
                      :title="$t('Optimized encoding provides better quality and/or lower cpu/gpu usage. Depending on the game, resolution may be changed for a better quality of experience')">
                    </i>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <bool-input
        v-if="!midStreamMode && !isFacebook"
        v-model="doNotShowAgainModel"
        name='do_not_show_again'
        :metadata="{ title: $t('Do not show this message when going live') }"
      />
      <div class="warning" v-if="updateError">
        <div v-if="midStreamMode">
          {{ $t('Something went wrong while updating your stream info.  Please try again.') }}
        </div>
        <div v-else>
          {{ $t('Something went wrong while updating your stream info. You can try again, or you can') }}
          <a @click="goLive">{{ $t('just go live') }}</a>.
        </div>
      </div>
    </div>
  </div>
  <div slot="controls">
    <button
      class="button button--default"
      :disabled="updatingInfo"
      @click="cancel">
      {{ isSchedule ? $t('Close') : $t('Cancel') }}
    </button>
    <button
      class="button button--action"
      :disabled="updatingInfo || (isFacebook && !hasPages)"
      @click="handleSubmit">
      <i class="fa fa-spinner fa-pulse" v-if="updatingInfo" />
      {{ submitText }}
    </button>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./EditStreamInfo.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

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
