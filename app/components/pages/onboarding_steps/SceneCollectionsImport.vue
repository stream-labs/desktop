<template>
<div>
  <div class="onboarding-step">
    <div class="onboarding-title">Scene Collections Import</div>
    <div class="onboarding-desc">The following scene collections have been imported from your Streamlabs account</div>
    <ul class="scene-collections-list">
      <li v-for="collection in sceneCollections" :key="collection.id">
        {{ collection.name }}
      </li>
    </ul>
    <button
      class="button button--action button--lg"
      @click="next">
      Continue
    </button>
  </div>
</div>
</template>

<script lang="ts" src="./SceneCollectionsImport.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';

.scene-collections-list {
  margin: 0;
  padding: 10px;
  width: 100%;
  height: 200px;
  color: white;
  list-style: none;
  overflow: auto;
  border-radius: 3px;
  background: @day-secondary;
}

.night-theme {
  .scene-collections-list {
    background: @night-secondary;
  }
}
</style>
