<template>
  <div>
    <div class="onboarding-step">
      <div class="onboarding-title">{{ title }}</div>
      <div class="onboarding-desc">{{ description }}</div>
      <div v-if="status === 'done'">
        <button
          class="button button--action button--lg"
          @click="next">
          {{ $t('Continue') }}
        </button>
      </div>
      <div v-if="status === 'importing'">
        <i class="importing-spinner fa fa-spinner fa-pulse" />
      </div>
      <div v-if="status === 'initial'">
        <div v-if="profiles.length > 1">
          <span class="profile-select__title">{{ $t('Select an OBS profile to import') }}</span>
          <multiselect
            v-if="profiles.length > 1"
            v-model="selectedProfile"
            :options="profiles"
            :allow-empty="false"
            :show-labels="false"/>
        </div>
        <button
          class="button button--action button--lg"
          @click="startImport">
          {{ $t('Import from OBS') }}
        </button>
        <button
          class="button button--dark button--lg"
          @click="startFresh">
          {{ $t('Start Fresh') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./ObsImport.vue.ts"></script>

<style lang="less">
@import '../../../styles/index';

// 3rd Party Component
.multiselect__content-wrapper {
  left: -50%;
  border-radius: 0 0 3px 3px;
}
</style>

<style lang="less" scoped>
label {
  text-align: left;
}

.profile-select__title {
  display: block;
  margin-bottom: 8px;
}

.importing-spinner {
  font-size: 32px;
}
</style>
