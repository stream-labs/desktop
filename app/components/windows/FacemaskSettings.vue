<template>
<modal-layout
  :show-controls="false" :customControls="true"
  title="Face Mask Settings">
    <div slot="content">
      <div class="row">
        <h-form-group :title="$t('Face Masks Enabled')">
          <toggle-input
            v-model="enabledModel"
            name="enabled"
            :metadata="{ title: $t('Enable Face Masks') }"
          />
        </h-form-group>
      </div>
      <div class="row">
        <h-form-group :title="$t('Download Progress')">
          <progress-bar :progressComplete="downloadProgress"></progress-bar>
        </h-form-group>
      </div>
      <div class="row">
        <h-form-group :title="$t('Alert Duration')">
          <slider-input v-model="durationModel" :metadata="{min: 8, max: 60}"/>
        </h-form-group>
      </div>
      <div class="row">
        <h-form-group :title="$t('Video Device')">
          <list-input
            @input="onVideoInputSelect"
            v-model="videoInputModel"
            :metadata="videoInputMetadata"
          />
        </h-form-group>
      </div>
      <div class="row">
        <h-form-group :title="$t('Face Mask Donations')">
          <toggle-input
            v-model="donationsEnabledModel"
            name="donationsEnabled"
            :metadata="{ title: $t('Enable Face Mask Donations') }"
          />
        </h-form-group>
      </div>
      <div class="row">
        <h-form-group :title="$t('Sub Masks')">
          <toggle-input
            v-model="subsEnabledModel"
            name="subsEnabled"
            :metadata="{ title: $t('Enable Sub Masks') }"
          />
        </h-form-group>
      </div>
      <div class="row">
        <h-form-group :title="$t('T2 Sub Masks')">
          <item-grid>
            <virtual-item
              v-for="(mask) in t2AvailableMasks"
              :key="mask.uuid"
              :preview="`http://facemasks-cdn.streamlabs.com/${mask.uuid}.png`"
              :name="mask.name"
              :selected="mask.selected"
              @click="clickMask(mask, t2AvailableMasks)"
            ></virtual-item>
          </item-grid>
        </h-form-group>
      </div>
      <div class="row">
        <h-form-group :title="$t('T3 Sub Masks')">
          <item-grid>
            <virtual-item
              v-for="(mask) in t3AvailableMasks"
              :key="mask.uuid"
              :preview="`http://facemasks-cdn.streamlabs.com/${mask.uuid}.png`"
              :name="mask.name"
              :selected="mask.selected"
              @click="clickMask(mask, t3AvailableMasks)"
            ></virtual-item>
          </item-grid>
        </h-form-group>
      </div>
    </div>
    <div slot="controls">
      <button class="button button--default" @click="cancel">
        {{$t('Close')}}
      </button>
      <button
        class="button button--action"
        @click="handleSubmit"
      >
        <i class="fa fa-spinner fa-pulse" v-if="updatingInfo" />  {{$t('Save')}}
      </button>
    </div>
</modal-layout>
</template>

<script lang="ts" src="./FacemaskSettings.vue.ts"></script>
<style lang="less" scoped>
  .row {
    flex-wrap: nowrap;
    width: 100%;
    margin-left: 15px;
  }

  .row > div {
    margin-right: 15px;
  }
</style>
