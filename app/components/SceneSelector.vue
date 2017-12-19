<template>
<div rel="SceneSelector">
  <div class="studio-controls-top">

    <div class="scene-collections-wrapper">

      <DropdownMenu :title="activeConfig">
        <div class="dropdown-menu__item" @click="addCollection">New</div>
        <div class="dropdown-menu__item" @click="duplicateCollection">Duplicate</div>
        <div class="dropdown-menu__item" @click="renameCollection">Rename</div>
        <div class="dropdown-menu__item" @click="removeCollection">Remove</div>
        <div class="dropdown-menu__separator"></div>
        <div
          v-for="sceneCollection in scenesCollections"
          class="dropdown-menu__item"
          :class="{ active: activeConfig === sceneCollection }"
          @click="loadConfig(sceneCollection)"
        >
          {{ sceneCollection }}
        </div>
      </DropdownMenu>

    </div>

    <div>
      <i
        class="fa fa-plus icon-btn icon-btn--lg"
        @click="addScene"/>
      <i
        class="fa fa-minus icon-btn icon-btn--lg"
        @click="removeScene"/>
      <i
        class="fa fa-cog icon-btn icon-btn--lg"
        @click="showTransitions"/>
    </div>
  </div>

  <selector
    class="studio-controls-selector"
    :items="scenes"
    :activeItems="activeSceneId ? [activeSceneId] : []"
    @select="makeActive"
    @sort="handleSort"
    @contextmenu="showContextMenu"
  />
</div>
</template>

<script lang="ts" src="./SceneSelector.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.scene-collections-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
</style>
