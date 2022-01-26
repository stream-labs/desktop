<template>
  <div rel="SceneSelector">
    <div class="studio-controls-top">
      <div class="scene-collections-wrapper">
        <DropdownMenu class="scene-collections__dropdown" :title="activeCollection.name">
          <div class="input-wrapper input-wrapper--search">
            <input
              class="input--search"
              type="text"
              :placeholder="$t('Search')"
              v-model="searchQuery"
            />
          </div>

          <div class="link link--pointer" @click="manageCollections">
            {{ $t('Manage All') }}
          </div>
          <div class="dropdown-menu__separator"></div>
          <div
            v-for="sceneCollection in sceneCollections"
            :key="sceneCollection.id"
            class="dropdown-menu__item"
            :class="{
              active: activeId === sceneCollection.id,
              'dropdown-menu__disabled': sceneCollection.operatingSystem !== os,
            }"
            @click="loadCollection(sceneCollection.id)"
          >
            <i
              class="fab"
              :class="{
                'fa-apple': sceneCollection.operatingSystem === 'darwin',
                'fa-windows': sceneCollection.operatingSystem === 'win32',
              }"
            />
            {{ sceneCollection.name }}
          </div>
        </DropdownMenu>
      </div>

      <div style="display: flex;">
        <i
          class="icon-add icon-button icon-button--lg"
          @click="addScene"
          v-tooltip.bottom="addSceneTooltip"
        />
        <i
          class="icon-subtract icon-button icon-button--lg"
          @click="removeScene"
          v-tooltip.bottom="removeSceneTooltip"
        />
        <i
          class="icon-settings icon-button icon-button--lg"
          @click="showTransitions"
          v-tooltip.bottom="showTransitionsTooltip"
        />
      </div>
    </div>
    <scrollable className="vue-tree-container">
      <sl-vue-tree
        data-name="scene-selector"
        :value="scenes"
        ref="slVueTree"
        @select="makeActive"
        @input="handleSort"
        @contextmenu.native.stop="showContextMenu()"
      >
        <template slot="title" slot-scope="{ node }">
          <span class="item-title">{{ node.title }}</span>
        </template>
      </sl-vue-tree>
    </scrollable>

    <help-tip :dismissable-key="helpTipDismissable" :position="{ top: '-8px', left: '102px' }">
      <div slot="title">
        {{ $t('Scene Collections') }}
      </div>
      <div slot="content">
        {{
          $t(
            'This is where your Scene Collections live. Clicking the title will dropdown a menu where you can view & manage.',
          )
        }}
      </div>
    </help-tip>
  </div>
</template>

<script lang="ts" src="./SceneSelector.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';

.scene-collections-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 50%;
}

.input-wrapper--search {
  width: 100%;
  margin-bottom: 10px;
}

.scene-collections__dropdown {
  & /deep/ .popper {
    text-align: left;
  }

  & /deep/ .popper.dropdown-menu {
    min-width: 200px;
  }
}

.sl-vue-tree-title {
  min-width: 0;

  .item-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
