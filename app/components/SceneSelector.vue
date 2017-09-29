<template>
<div>
  <div class="studio-controls-top">
    <h4 class="studio-controls__label">
      Scenes
    </h4>
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
    :activeItem="activeSceneId"
    @select="makeActive"
    @sort="handleSort"
    @contextmenu="menu.popup()"
  />
</div>
</template>

<script lang="ts" src="./SceneSelector.vue.ts"></script>
