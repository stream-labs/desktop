<template>
<div>
  <div class="onboarding-step">
    <div class="onboarding-title">{{ $t('onboarding.sceneCollectionsImportTitle') }}</div>
    <div class="onboarding-desc">{{ $t('onboarding.sceneCollectionsImportDescription') }}</div>
    <ul class="scene-collections-list">
      <li v-for="collection in sceneCollections" :key="collection.id">
        {{ collection.name }}
      </li>
    </ul>
    <button
      class="button button--action button--lg"
      @click="next">
      {{ $t('common.continue') }}
    </button>
  </div>
</div>
</template>

<script lang="ts" src="./SceneCollectionsImport.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/_colors";

.scene-collections-list {
  margin: 0;
  padding: 10px;
  width: 100%;
  height: 200px;
  color: white;
  list-style: none;
  overflow: auto;
  border-radius: 3px;
  background: @bg-secondary;
}

</style>
