<template>

  <div>
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
      :maxScrollSpeed="15"
      class="selector-list">

      <template slot="title" slot-scope="{ node }" class="selector-item">
        <span class="selector-item__icon">
          <i :class="determineIcon(node.isLeaf, node.data.sourceId)"></i>
        </span>
        <span class="selector-item__title">{{ node.title }}</span>
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
</style>
