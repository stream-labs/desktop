<template>
  <div class="source-selector">
    <div class="studio-controls-top">
      <h4 class="studio-controls__label" v-tooltip.bottom="sourcesTooltip">
        Sources
      </h4>
      <div>
        <i
          class="icon-add-folder icon-btn icon-btn--lg"
          @click="addFolder"
          v-tooltip.bottom="addGroupTooltip" />
        <i
          class="icon-add icon-btn icon-btn--lg"
          @click="addSource"
          v-tooltip.bottom="addSourceTooltip" />
        <i
          class="icon-subtract icon-btn icon-btn--lg"
          :class="{ disabled: activeItemIds.length === 0}" @click="removeItems"
          v-tooltip.bottom="removeSourcesTooltip" />
        <i
          :class="{ disabled: !canShowProperties()}"
          class="icon-settings icon-btn"
          @click="sourceProperties"
          v-tooltip.bottom="openSourcePropertiesTooltip" />
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
            <i v-if="!node.isLeaf" class="fa fa-folder"></i>
            <i v-else-if="node.data.type === 'ffmpeg_source'" class="fa fa-film"></i>
            <i v-else-if="node.data.type === 'image_source'" class="fa fa-image"></i>
            <i v-else-if="node.data.type === 'slideshow'" class="fa fa-images"></i>
            <i v-else-if="node.data.type === 'text_gdiplus'" class="fa fa-font"></i>
            <i v-else-if="node.data.type === 'text_ft2_source'" class="fa fa-font"></i>
            <i v-else-if="node.data.type === 'dshow_input'" class="fa fa-camera"></i>
            <i v-else-if="node.data.type === 'wasapi_input_capture'" class="fa fa-microphone"></i>
            <i v-else-if="node.data.type === 'wasapi_output_capture'" class="fa fa-volume-up"></i>
            <i v-else-if="node.data.type === 'monitor_capture'" class="fa fa-desktop"></i>
            <i v-else-if="node.data.type === 'game_capture'" class="fa fa-gamepad"></i>
            <i v-else-if="node.data.type === 'browser_source'" class="fa fa-globe"></i>
            <i v-else-if="node.data.type === 'scene'" class="fa fa-sitemap"></i>
            <i v-else-if="node.data.type === 'color_source'" class="fa fa-paint-brush"></i>
            <i v-else class="fa fa-file"></i>
          </span>
          <span class="item-title">{{ node.title }}</span>
        </div>
      </template>

      <template slot="toggle" slot-scope="{ node }">
        <span v-if="!node.isLeaf && node.children.length">
          <i v-if="node.isExpanded" class="icon-down"></i>
          <i v-if="!node.isExpanded" class="icon-down icon-right"></i>
        </span>
      </template>

      <template slot="sidebar" slot-scope="{ node }" v-if="canShowActions(node.data.id)">
        <i class="source-selector-action" :class="lockClassesForSource(node.data.id)" @click.stop="toggleLock(node.data.id)" @dblclick.stop="() => {}"></i>
        <i class="source-selector-action" :class="visibilityClassesForSource(node.data.id)" @click.stop="toggleVisibility(node.data.id)" @dblclick.stop="() => {}"></i>
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
  color: @grey;
}

.fa.disabled,
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
      color: @grey;
    }
  }
}

.sl-vue-tree-node-item {
  cursor: pointer;
  border: 1px solid transparent;
  border-right: 0;
  border-left: 0;
  margin-top: -1px;
}

.title-container {
  display: inline-block;
  color: @grey;
}

.layer-icon {
  display: inline-block;
  text-align: left;
  width: 16px;
  margin-right: 8px;

  i,
  .fa {
    font-size: 12px;
    font-weight: 700;
  }
}

.title-container {
  color: @day-title
}

.sl-vue-tree-toggle {
  width: 16px;
  margin-right: 8px;
  display: inline-block;

  i {
    font-size: 7px;
    font-weight: 700;
    color: @day-title;
    text-align: center;
  }
}

.sl-vue-tree.sl-vue-tree-root {
  background-color: @day-secondary;
  border-color: @day-border;
  color: @day-title;
}

.sl-vue-tree-selected>.sl-vue-tree-node-item {
  border-color: @day-border;
  border-left: none;
  border-right: none;
  background-color: @white;
}

.sl-vue-tree-node-item:hover {
  color: white;
}

.sl-vue-tree-cursor {
  border-color: @navy;
}

.sl-vue-tree-node-item.sl-vue-tree-cursor-inside {
  border-color: @navy;
}

.night-theme {
  .title-container {
    color: @grey;
  }

  .sl-vue-tree.sl-vue-tree-root {
    background-color: @night-secondary;
    border-color: @night-secondary;
    color: @grey;
  }

  .sl-vue-tree-selected>.sl-vue-tree-node-item {
    background-color: @night-hover;
    border-color: transparent;
    color: @white;
  }

  .sl-vue-tree-toggle {
    i {
      color: @grey;
    }
  }
}
</style>
