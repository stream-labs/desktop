<template>
  <div data-test="ObsImport">
    <div class="onboarding-step">
      <div class="onboarding-title">{{ title }}</div>
      <div class="onboarding-desc">{{ description }}</div>
      <div v-if="status === 'done'">
        <button
          class="button button--action button--lg"
          @click="next">
          {{ $t('common.continue') }}
        </button>
      </div>
      <div v-if="status === 'importing'">
        <i class="importing-spinner icon-spinner icon-spin" />
      </div>
      <NAirObsLogo />
      <div class="obs-import-contents" v-if="status === 'initial'">
        <div v-if="profiles.length > 1">
          {{ $t('onboarding.selectObsProfile') }}
          <multiselect
            v-if="profiles.length > 1"
            v-model="selectedProfile"
            :options="profiles"
            :allow-empty="false"
            :show-labels="false">
          </multiselect>
        </div>
        <button
          class="button button--niconico"
          @click="startImport"
          data-test="Import">
          {{ $t('onboarding.importFromObs') }}
        </button>
        <button
          class="button button--skip"
          @click="startFresh"
          data-test="Skip">
          {{ $t('onboarding.skipImport') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./ObsImport.vue.ts"></script>

<style lang="less" scoped>
label {
  text-align: left;
}

.importing-spinner {
  font-size: 32px;
}

.obs-import-contents {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.import-obs-image {
  width: 512px;
  margin: 20px 0;
}

button {
  width: 256px;
  margin-bottom: 24px;
}

.icon-spin {
  animation: icon-spin 2s infinite linear;
}

@keyframes icon-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(359deg);
  }
}
</style>
