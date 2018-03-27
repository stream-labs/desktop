<template>
<div class="source-selector">
  <div class="studio-controls-top">
    <h4 class="studio-controls__label">
      Sources
    </h4>
    <div>
      <i
        class="fa fa-folder-open icon-btn icon-btn--lg"
        @click="addFolder"
        title="Add Folder"
      />

      <i
        class="fa fa-plus icon-btn icon-btn--lg"
        @click="addSource"
        title="Add Source"
      />
      <i
        class="fa fa-minus icon-btn icon-btn--lg"
        :class="{ disabled: activeItemIds.length === 0}"
        @click="removeItems"
        title="Remove Sources"
      />
      <i
        :class="{ disabled: !canShowProperties()}"
        class="fa fa-cog icon-btn"
        @click="sourceProperties"
        title="Setup Source Properties"
      />
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
    :maxScrollSpeed="15"
  >

    <template slot="title" slot-scope="{ node }">
      <div class="title-container">
        <span class="item-icon">
          <i v-if="!node.isLeaf" class="fa fa-folder" ></i>
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
      <span v-if="!node.isLeaf && node.children.length" >
        <i v-if="node.isExpanded" class="fa fa-chevron-down icon-btn"></i>
        <i v-if="!node.isExpanded" class="fa fa-chevron-right icon-btn"></i>
      </span>
    </template>


    <template slot="sidebar" slot-scope="{ node }" v-if="canShowActions(node.data.id)">
      <i
          class="fa fa-lock icon-btn source-selector-action"
          :class="lockClassesForSource(node.data.id)"
          @click.stop="toggleLock(node.data.id)"
          @dblclick.stop="() => {}" ></i>
      <i
          class="fa fa-eye icon-btn source-selector-action"
          :class="visibilityClassesForSource(node.data.id)"
          @click.stop="toggleVisibility(node.data.id)"
          @dblclick.stop="() => {}" ></i>
    </template>


  </sl-vue-tree>
</div>


</template>

<script lang="ts" src="./SourceSelector.vue.ts"></script>

<style lang="less" >
@import "../styles/index";
@import "~sl-vue-tree/dist/sl-vue-tree-dark.css";

.source-selector-action {
  font-size: 16px;
}

.fa.disabled {
  opacity: 0.15;
  cursor: inherit;

  :hover {
    opacity: inherit;
  }
}

.sl-vue-tree.sl-vue-tree-root {
  flex-grow: 1;
  overflow: auto;
}

.source-selector-action {
  display: none;
}

.sl-vue-tree-node-item {
  cursor: pointer;
}

.sl-vue-tree-node-item:hover {

  .source-selector-action {
    display: inline-block;
  }
}

.title-container {
  display: inline-block;
  color: @grey;
}

.item-icon {
  display: inline-block;
  text-align: left;
  width: 20px;
}

.day-theme {

  .title-container {
    color: @navy
  }

  .sl-vue-tree.sl-vue-tree-root {
    background-color: @day-secondary;
    border-color: @day-border;
    color: @navy-secondary;
  }

  .sl-vue-tree-node-item {

  }

  .sl-vue-tree-selected > .sl-vue-tree-node-item {
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

}

</style>
