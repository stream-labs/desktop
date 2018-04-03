<template>
<modal-layout
  title="Update Stream Info"
  :show-controls="false"
  :customControls="true">
  <div slot="content">
    <div v-if="infoLoading">
      <i class="fa fa-spinner fa-pulse" />
    </div>
    <div v-if="infoError && !infoLoading" class="warning">
      There was an error fetching your channel information.  You can try
      <a @click="refreshStreamInfo">fetching the information again</a>,
      or you can
      <a @click="goLive">just go live.</a>
      If this error persists, you can try logging out and back in.
    </div>
    <div v-if="!infoLoading && !infoError">
      <TextInput v-model="streamTitleModel" />
      <TextInput  v-if="isYoutube" v-model="streamDescriptionModel" />
      <ListInput
        v-if="isTwitch || isMixer"
        :value="gameModel"
        :allowEmpty="true"
        placeholder="Search"
        :internal-search="false"
        :loading="searchingGames"
        @search-change="debouncedGameSearch"
        @input="onGameInput"/>
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
                <label><span>Use optimized encoder settings</span>  <span><i class="tooltip-trigger fa fa-question-circle has-tooltip" style="font-size:15px;whitespace: nowrap;" title="Optimized encoder gives equivalent quality while reducing usage.
Game specific encoders for Fortnite,PUBG,Destiny 2, and League Of Legends"></i></span></label>
                
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
      <BoolInput v-model="doNotShowAgainModel" v-if="!midStreamMode"/>
      <div class="warning" v-if="updateError">
        <div v-if="midStreamMode">
          Something went wrong while updating your stream info.  Please try again.
        </div>
        <div v-else>
          Something went wrong while updating your stream info. You can try again, or you can
          <a @click="goLive">just go live</a>.
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
      :disabled="updatingInfo"
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
    color: @night-text;
  }
}
</style>
