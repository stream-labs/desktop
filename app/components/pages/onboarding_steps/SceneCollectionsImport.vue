<template>
<div>
  <div class="onboarding-step">
    <div class="onboarding-title">{{ $t('Scene Collections Import') }}</div>
    <div class="onboarding-desc">{{ $t('The following scene collections have been imported from your Streamlabs account') }}</div>
    <ul class="scene-collections-list">
      <li v-for="collection in sceneCollections" :key="collection.id">
        {{ collection.name }}
      </li>
    </ul>
    <button
      class="button button--action button--lg"
      @click="next">
      {{ $t('Continue') }}
    </button>
  </div>
</div>
</template>

<script lang="ts" src="./SceneCollectionsImport.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';

.scene-collections-list {
  margin-left: 0;
  padding: 10px;
  width: 100%;
  height: 200px;
  color: var(--paragraph);
  list-style: none;
  overflow: auto;
  .radius();
  background: var(--section);
}
</style>
