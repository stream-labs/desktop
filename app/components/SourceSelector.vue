<template>

  <div class="source-selector">
    <div class="studio-controls-top">
      <h2 class="studio-controls__label" v-tooltip.bottom="sourcesTooltip">
        {{ $t('Sources') }}
      </h2>
      <div>
        <i
          class="icon-add-folder icon-button icon-button--lg"
          @click="addFolder"
          v-tooltip.bottom="addGroupTooltip" />
        <i
          class="icon-add icon-button icon-button--lg"
          @click="addSource"
          v-tooltip.bottom="addSourceTooltip" />
        <i
          class="icon-subtract icon-button icon-button--lg"
          :class="{ disabled: activeItemIds.length === 0}" @click="removeItems"
          v-tooltip.bottom="removeSourcesTooltip" />
        <i
          :class="{ disabled: !canShowProperties()}"
          class="icon-settings icon-button"
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
        <span class="layer-icon">
          <i :class="determineIcon(node.isLeaf, node.data.sourceId)"></i>
        </span>
        <span class="item-title">{{ node.title }}</span>
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

<style lang="less">
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

.sl-vue-tree.sl-vue-tree-root {
  border-color: @day-section;
}

.sl-vue-tree-node-item {
  cursor: pointer;
  border: 1px solid transparent;
  border-right: 0;
  border-left: 0;
  margin-top: -1px;
  padding: 0 12px;
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

.night-theme {
  .title-container {
    color: @grey;
  }

  .sl-vue-tree.sl-vue-tree-root {
    border-color: @night-section;
  }
}
</style>
