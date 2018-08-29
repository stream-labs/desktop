<template>

  <div class="source-selector" data-test="SourceSelector">
    <div class="studio-controls-top">
      <h4 class="studio-controls__label" v-tooltip.bottom="sourcesTooltip">
        {{ $t('common.sources') }}
      </h4>
      <div>
        <i
          class="icon-add-folder icon-btn icon-btn--lg"
          @click="addFolder"
          v-tooltip.bottom="addGroupTooltip"
          data-test="AddFolder" />
        <i
          class="icon-add-file icon-btn icon-btn--lg"
          @click="addSource"
          v-tooltip.bottom="addSourceTooltip"
          data-test="Add" />
        <i
          class="icon-delete icon-btn icon-btn--lg"
          :class="{ disabled: activeItemIds.length === 0}" @click="removeItems"
          v-tooltip.bottom="removeSourcesTooltip"
          data-test="Remove" />
        <i
          :class="{ disabled: !canShowProperties()}"
          class="icon-settings icon-btn"
          @click="sourceProperties"
          v-tooltip.bottom="openSourcePropertiesTooltip"
          data-test="Edit" />
      </div>
    </div>

    <sl-vue-tree
      :value="nodes"
      ref="slVueTree"
      @select="makeActive"
      @drop="handleSort"
      @toggle="toggleFolder"
      @contextmenu.native="showContextMenu()"
      @nodecontextmenu="(node, event) => showContextMenu(node.data.id, event)"
      @nodedblclick="node => sourceProperties(node.data.id)"
      :scrollAreaHeight="50"
      :maxScrollSpeed="15">

      <template slot="title" slot-scope="{ node }">
        <div class="title-container">
          <span class="layer-icon">
            <i v-if="!node.isLeaf" class="icon-folder"/>
            <i v-else-if="node.data.type === 'ffmpeg_source'" class="icon-media"/>
            <i v-else-if="node.data.type === 'image_source'" class="icon-image"/>
            <i v-else-if="node.data.type === 'slideshow'" class="icon-slideshow"/>
            <i v-else-if="node.data.type === 'text_gdiplus'" class="icon-text"/>
            <i v-else-if="node.data.type === 'text_ft2_source'" class="icon-text"/>
            <i v-else-if="node.data.type === 'dshow_input'" class="icon-video-capture"/>
            <i v-else-if="node.data.type === 'wasapi_input_capture'" class="icon-mic"/>
            <i v-else-if="node.data.type === 'ndi_source'" class="icon-ndi"/>
            <i v-else-if="node.data.type === 'wasapi_output_capture'" class="icon-speaker"/>
            <i v-else-if="node.data.type === 'monitor_capture'" class="icon-display"/>
            <i v-else-if="node.data.type === 'game_capture'" class="icon-game-capture"/>
            <i v-else-if="node.data.type === 'browser_source'" class="icon-browser"/>
            <i v-else-if="node.data.type === 'scene'" class="icon-studio-mode"/>
            <i v-else-if="node.data.type === 'color_source'" class="icon-color"/>
            <i v-else-if="node.data.type === 'openvr_capture'" class="icon-vr-google"/>
            <i v-else-if="node.data.type === 'liv_capture'" class="icon-vr-google"/>
            <i v-else class="icon-file"/>
          </span>
          <span class="item-title" :data-test="node.title">{{ node.title }}</span>
        </div>
      </template>

      <template slot="toggle" slot-scope="{ node }">
        <span v-if="!node.isLeaf && node.children.length">
          <i v-if="node.isExpanded" class="icon-down-arrow"/>
          <i v-if="!node.isExpanded" class="icon-down-arrow icon-right"/>
        </span>
      </template>

      <template slot="sidebar" slot-scope="{ node }" v-if="canShowActions(node.data.id)">
        <i class="source-selector-action" :class="lockClassesForSource(node.data.id)" @click.stop="toggleLock(node.data.id)" @dblclick.stop="() => {}"/>
        <i class="source-selector-action" :class="visibilityClassesForSource(node.data.id)" @click.stop="toggleVisibility(node.data.id)" @dblclick.stop="() => {}"/>
      </template>

    </sl-vue-tree>
  </div>
</template>

<script lang="ts" src="./SourceSelector.vue.ts"></script>

<style lang="less" >
@import "../styles/index";
@import "~sl-vue-tree/dist/sl-vue-tree-dark.css";

.source-selector-action {
  display: inline-block;
  width: 16px;
  text-align: center;
  opacity: .26;
  margin-left: 8px;
  color: @text-primary;
}

.sl-vue-tree-node-item {
  padding: 0 4px;
}

i.disabled {
  opacity: 0.26;
  cursor: inherit;

   :hover {
    opacity: inherit;
  }
}

.sl-vue-tree.sl-vue-tree-root {
  flex-grow: 1;
  overflow: auto;
}

.sl-vue-tree-node {
  &:hover,
  &.sl-vue-tree-selected {
    .transition;

    .source-selector-action {
      .transition;
      opacity: 1;
      color: @text-primary;
    }

    .title-container {
      color: @text-primary;
    }
  }
}

.sl-vue-tree-node-item {
  cursor: pointer;
  margin-top: -1px;
  border: none;
}

.title-container {
  display: inline-block;
  color: @text-primary;
}

.layer-icon {
  display: inline-block;
  text-align: left;
  width: 16px;

  i {
    font-size: 12px;
    font-weight: 700;
  }
}

.title-container {
  color: @text-secondary;
  &:hover {
    color: @text-primary;
  }
}

.sl-vue-tree-toggle {
  width: 16px;
  margin-right: 8px;
  display: inline-block;

  i {
    font-size: 7px;
    font-weight: 700;
    color: @text-primary;
    text-align: center;
  }
}

.sl-vue-tree.sl-vue-tree-root {
  color: @text-primary;
  background-color: #050e18;
  border: #050e18 1px solid;
}

.sl-vue-tree-selected>.sl-vue-tree-node-item {
  background-color: @hover;
  color: @text-primary;
}

.sl-vue-tree-node-item:hover {
  color: @text-primary;
}

.sl-vue-tree-cursor {
  border-color: @navy;
}

.sl-vue-tree-node-item.sl-vue-tree-cursor-inside {
  border-color: @navy;
}

//Simple Mode
.advanced-theme {
  .icon-add-folder {
    display: inline-block;
  }
}

.beginner-theme {
  .icon-add-folder {
    display: none;
  }
}

</style>
