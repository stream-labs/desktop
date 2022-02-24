<template>
  <div class="source-selector">
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
