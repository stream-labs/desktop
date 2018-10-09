<template>
<div rel="SceneSelector">
  <div class="studio-controls-top">

    <div class="scene-collections-wrapper">

      <DropdownMenu class="scene-collections__dropdown" :title="activeCollection.name">
        <div class="input-wrapper input-wrapper--search">
          <input class="input--search" type="text" :placeholder="$t('Search')" v-model="searchQuery" />
        </div>

        <div class="link link--pointer" @click="manageCollections">
          {{ $t('Manage All') }}
        </div>
        <div class="dropdown-menu__separator"></div>
        <div
          v-for="sceneCollection in sceneCollections"
          :key="sceneCollection.id"
          class="dropdown-menu__item"
          :class="{ active: activeId === sceneCollection.id }"
          @click="loadCollection(sceneCollection.id)"
        >
          {{ sceneCollection.name }}
        </div>
      </DropdownMenu>

    </div>

    <div>
      <i
        class="icon-add icon-button icon-button--lg"
        @click="addScene"
        v-tooltip.bottom="addSceneTooltip" />
      <i
        class="icon-subtract icon-button icon-button--lg"
        @click="removeScene"
        v-tooltip.bottom="removeSceneTooltip" />
      <i
        class="icon-settings icon-button icon-button--lg"
        @click="showTransitions"
        v-tooltip.bottom="showTransitionsTooltip"/>
    </div>
  </div>

  <selector
    :items="scenes"
    :activeItems="activeSceneId ? [activeSceneId] : []"
    @select="makeActive"
    @sort="handleSort"
    @contextmenu="showContextMenu"
  />

  <help-tip :dismissable-key="helpTipDismissable">
    <div slot="title">
      {{ $t('Scene Collections') }}
    </div>
    <div slot="content">
      {{ $t('This is where your Scene Collections live. Clicking the title will dropdown a menu where you can view & manage.') }}
    </div>
  </help-tip>
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

.input-wrapper--search {
  width: 100%;
  .margin-bottom();
}

.scene-collections__dropdown {
  min-width: 200px;
}
</style>
