<template>
<modal-layout
  :show-controls="false"
  :customControls="true">
  <div slot="content">
    <div v-if="infoLoading">
      <i class="fa fa-spinner fa-pulse" />
    </div>
    <div v-if="infoError && !infoLoading" class="warning">
      {{ $t('There was an error fetching your channel information.  You can try') }}
      <a @click="refreshStreamInfo">{{ $t('fetching the information again') }}</a>,
      {{ $t('or you can') }}
      <a @click="goLive">{{ $t('just go live.') }}</a>
      {{ $t('If this error persists, you can try logging out and back in.') }}
    </div>
    <div v-if="!infoLoading && !infoError">
      <ObsTextInput v-model="streamTitleModel" />
      <ObsTextInput  v-if="isYoutube || isFacebook" v-model="streamDescriptionModel" />
      <ObsListInput
        v-if="isTwitch || isMixer || isFacebook"
        :value="gameModel"
        :allowEmpty="true"
        placeholder="Search"
        :internal-search="false"
        :loading="searchingGames"
        @search-change="debouncedGameSearch"
        @input="onGameInput"/>
      <div class="warning" v-if="isFacebook && !hasPages">
        {{ $t('It looks like you don\'t have any Streaming Pages. Head to ') }}
        <a @click="openFBPageCreateLink">{{ $t('Facebook Page Creation') }}</a>
        {{ $t(' to create a streaming-enabled page, and then logging out and back in to see that page.') }}
      </div>
      <ObsListInput
        v-if="isFacebook && hasPages && !midStreamMode"
        :value="pageModel"
        @input="(pageId) => setFacebookPageId(pageId)"
      />
      <div v-if="areAvailableProfiles">
        <div class="input-container" v-if="isTwitch || isYoutube">
          <div class="input-label"/>
          <div class="input-wrapper">
            <div class="checkbox">
              <div v-if="!isGenericProfiles">
                <input
                  type="checkbox"
                  v-model="useOptimizedProfile"
                />
                <label><span>Use {{gameModel.value}} encoder settings</span></label>
              </div>
              <div v-else>
                <input
                  type="checkbox"
                  v-model="useOptimizedProfile"
                />
                <label><span>{{ $t('Use optimized encoder settings') }}</span>
                  <span>
                    <i class="tooltip-trigger fa fa-question-circle has-tooltip"
                      style="font-size:15px;whitespace: nowrap;"
                      :title="$t('Optimized encoder gives equivalent quality while reducing usage. Game specific encoders for Fortnite, PUBG, Destiny 2, and League Of Legends')">
                    </i>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="input-container select" v-show="useOptimizedProfile">
          <div class="input-label">
            <label>Profile</label>
          </div>
          <div class="input-wrapper">
            <multiselect
              :allowEmpty="false"
              :options="profiles"
              track-by="value"
              :close-on-select="true"
              label="description"
              v-model="encoderProfile">
              <template slot="option" slot-scope="props">
                <div class="edit-stream-info-option-desc">{{ props.option.description }}</div>
                <div class="edit-stream-info-option-longdesc">{{ props.option.longDescription }}</div>
              </template>
            </multiselect>
          </div>
        </div>
      </div>
      <ObsBoolInput v-model="doNotShowAgainModel" v-if="!midStreamMode"/>
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
      Cancel
    </button>
    <button
      class="button button--action"
      :disabled="updatingInfo || (isFacebook && !hasPages)"
      @click="updateAndGoLive">
      <i class="fa fa-spinner fa-pulse" v-if="updatingInfo" />
      {{ submitText }}
    </button>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./EditStreamInfo.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

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
