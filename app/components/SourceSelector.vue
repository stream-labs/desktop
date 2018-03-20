<template>
<div class="source-selector">
  <div class="studio-controls-top">
    <h4 class="studio-controls__label">
      Sources
    </h4>
    <div>

      <i
        class="fa fa-plus icon-btn icon-btn--lg"
        @click="addSource"/>
      <i
        class="fa fa-minus icon-btn icon-btn--lg"
        :class="{ disabled: activeItemIds.length === 0}"
        @click="removeItems"/>
      <i
        :class="{ disabled: !canShowProperties()}"
        class="fa fa-cog icon-btn"
        @click="sourceProperties"/>
    </div>
  </div>


    <sl-vue-tree
      :value="nodes"
      ref="slVueTree"
      @select="makeActive"
      @drop="handleSort"
      @toggle="toggleFolder"
      @dragleave="handleDragleave"
      @nodecontextmenu="node => showContextMenu(node.data.id)"
      @nodedblclick="node => sourceProperties(node.data.id)"
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
        <span v-if="!node.isLeaf">
          <i v-if="node.isExpanded" class="fa fa-chevron-down"></i>
          <i v-if="!node.isExpanded" class="fa fa-chevron-right"></i>
        </span>
      </template>


      <template slot="sidebar" slot-scope="{ node }">
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

/*.tree-container {*/
  /*flex-grow: 1;*/
  /*overflow: auto;*/
  /*background-color: rgb(9, 22, 29);*/
/*}*/

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

</style>
