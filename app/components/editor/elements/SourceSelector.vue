<template>
  <div class="source-selector">
    <div class="studio-controls-top">
      <h2 class="studio-controls__label" v-tooltip.bottom="sourcesTooltip">
        {{ $t('Sources') }}
      </h2>
      <div>
        <i
          :class="[
            { 'icon--active': selectiveRecordingEnabled },
            { disabled: selectiveRecordingLocked },
            'icon-smart-record icon-button icon-button--lg',
          ]"
          @click="toggleSelectiveRecording"
          v-tooltip.bottom="$t('Toggle Selective Recording')"
        />
        <i
          class="icon-add-folder icon-button icon-button--lg"
          @click="addFolder"
          v-tooltip.bottom="addGroupTooltip"
        />
        <i
          class="icon-add icon-button icon-button--lg"
          @click="addSource"
          v-tooltip.bottom="addSourceTooltip"
        />
        <i
          class="icon-subtract icon-button icon-button--lg"
          :class="{ disabled: activeItemIds.length === 0 }"
          @click="removeItems"
          v-tooltip.bottom="removeSourcesTooltip"
        />
        <i
          :class="{ disabled: !canShowProperties() }"
          class="icon-settings icon-button"
          @click="sourceProperties"
          v-tooltip.bottom="openSourcePropertiesTooltip"
        />
      </div>
    </div>

    <scrollable className="vue-tree-container" @contextmenu.native="e => showContextMenu(null, e)">
      <sl-vue-tree
        :value="nodes"
        ref="slVueTree"
        @select="makeActive"
        @drop="handleSort"
        @toggle="toggleFolder"
        @nodecontextmenu="(node, event) => showContextMenu(node.data.id, event)"
        @nodedblclick="node => sourceProperties(node.data.id)"
        :scrollAreaHeight="50"
        :maxScrollSpeed="15"
      >
        <template slot="title" slot-scope="{ node }">
          <span class="layer-icon" :ref="node.data.id">
            <i :class="determineIcon(node.isLeaf, node.data.sourceId)"></i>
          </span>
          <span class="item-title">{{ node.title }}</span>
        </template>

        <template slot="toggle" slot-scope="{ node }">
          <span v-if="!node.isLeaf">
            <i v-if="node.isExpanded" class="icon-down"></i>
            <i v-if="!node.isExpanded" class="icon-down icon-right"></i>
          </span>
        </template>

        <template slot="sidebar" slot-scope="{ node }" v-if="canShowActions(node.data.id)">
          <div class="icon-bar">
            <i
              v-if="selectiveRecordingEnabled"
              class="source-selector-action"
              v-tooltip="selectiveRecordingTooltip(node.data.id)"
              :class="[
                selectiveRecordingClassesForSource(node.data.id),
                isLocked(node.data.id) ? 'disabled' : '',
              ]"
              @click.stop="cycleSelectiveRecording(node.data.id)"
              @dblclick.stop="() => {}"
            />
            <i
              class="source-selector-action"
              :class="lockClassesForSource(node.data.id)"
              @click.stop="toggleLock(node.data.id)"
              @dblclick.stop="() => {}"
            ></i>
            <i
              class="source-selector-action"
              :class="visibilityClassesForSource(node.data.id)"
              @click.stop="toggleVisibility(node.data.id)"
              @dblclick.stop="() => {}"
            ></i>
          </div>
        </template>
      </sl-vue-tree>
    </scrollable>
  </div>
</template>

<script lang="ts" src="./SourceSelector.vue.ts"></script>

<style lang="less">
@import '../../../styles/index';
@import '~sl-vue-tree/dist/sl-vue-tree-dark.css';

.fa.disabled,
i.disabled {
  opacity: 0.26;
  cursor: not-allowed;

  &:hover {
    opacity: inherit;
  }
}

.sl-vue-tree-node-item {
  align-items: center;

  &:hover,
  &.sl-vue-tree-selected {
    .source-selector-action {
      opacity: 1;
      color: var(--icon);
    }
  }
  .icon-right {
    transform: translate(-20%, 180%) rotate(-90deg);
    display: block;
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

<style lang="less" scoped>
.source-selector-action {
  display: inline-block;
  width: 16px;
  text-align: center;
  opacity: 0.26;
  margin-left: 8px;
  color: var(--icon);
}

.icon--active {
  color: var(--icon-active);
}

.title-container {
  display: inline-block;
  color: var(--title);
}

.icon-bar {
  display: flex;
  flex-wrap: nowrap;
}
</style>
