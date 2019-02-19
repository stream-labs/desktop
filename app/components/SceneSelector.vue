<template>
<div data-test="SceneSelector">
  <div class="studio-controls-top">

    <div class="scene-collections-wrapper">

      <DropdownMenu class="scene-collections__dropdown" :title="activeCollection.name">
        <div class="input-wrapper input-wrapper--search">
          <input class="input--search" type="text" :placeholder="$t('common.search')" v-model="searchQuery" />
        </div>
        <a class="link settings-link" @click="manageCollections">
          <i class="icon-settings"/>
        </a>
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
        class="icon-add-file icon-btn icon-btn--lg"
        @click="addScene"
        data-test="Add" />
      <i
        class="icon-delete icon-btn icon-btn--lg"
        @click="removeScene"
        data-test="Remove" />
      <i
        class="icon-settings icon-btn icon-btn--lg"
        @click="showTransitions"
        data-test="Edit" />
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

  <help-tip :dismissable-key="helpTipDismissable">
    <div slot="title">
      {{ $t('scenes.sceneCollections') }}
    </div>
    <div slot="content">
      {{ $t('scenes.sceneCollectionSelectionDescription') }}
    </div>
  </help-tip>
</div>
</template>

<script lang="ts" src="./SceneSelector.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/_colors";

.scene-collections-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper--search {
  width: 89%;
  margin-bottom: 4px;
  border-radius: 25%;
  > input[type="text"] {
    background-color: @bg-primary!important;
    border:1px solid @text-secondary;
    &:focus {
      background-color: #3a585f!important;
      border:1px solid @text-primary;
    }
  }
}

.settings-link {
  position: absolute;
  top: 18px;
  right: 0;
  display: inline-block;
}
</style>
