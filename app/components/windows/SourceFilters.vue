<template>
  <modal-layout
    :show-cancel="false"
    :done-handler="done"
    :fixedSectionHeight="250"
  >
    <display slot="fixed" :sourceId="sourceId" />

    <div slot="content" class="modal--side-nav">
      <NavMenu v-model="selectedFilterName">
        <div class="controls">
          <i
            class="icon-add icon-button"
            @click="addFilter"></i>
          <i
            class="icon-subtract icon-button"
            v-if="selectedFilterName"
            @click="removeFilter"></i>
        </div>

        <sl-vue-tree
            :value="nodes"
            ref="slVueTree"
            @select="makeActive"
            @drop="handleSort"
            :allowMultiselect="false"
        >

          <template slot="title" slot-scope="{ node }">
            <div class="title-container">
              <span class="layer-icon">
                <i @click="toggleVisibility(node.title)" class="icon-view" v-if="node.data.visible"></i>
                <i @click="toggleVisibility(node.title)" class="icon-hide" v-if="!node.data.visible"></i>
              </span> &nbsp;
              <span class="item-title">{{ node.title }}</span>
            </div>
          </template>

        </sl-vue-tree>

      </NavMenu>

      <div class="modal-container--side-nav">
        <div v-if="selectedFilterName">
          <GenericForm v-if="properties.length" v-model="properties" @input="save" :key="selectedFilterName"></GenericForm>
          <div v-else>{{ $t("No settings are available for this filter") }}</div>
        </div>
        <div v-if="!selectedFilterName">
          {{ $t('No filters applied') }}
        </div>
      </div>
    </div>
  </modal-layout>
</template>

<script lang="ts" src="./SourceFilters.vue.ts"></script>

<style lang="less" scoped>
@import "~sl-vue-tree/dist/sl-vue-tree-dark.css";
@import "../../styles/index";

.modal-container--side-nav {
  .padding(2);
}

.modal--side-nav > .sl-vue-tree-toggle {
  display: none;
}

.controls {
  .margin-bottom(2);

  .icon-button {
    margin-left: 0;
    .margin-right(2);

    &:first-child {
      margin-left: 0;
    }
  }
}
</style>
