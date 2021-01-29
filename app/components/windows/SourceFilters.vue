<template>
  <modal-layout :show-cancel="false" :done-handler="done" :fixedSectionHeight="250">
    <display slot="fixed" :sourceId="sourceId" />

    <div slot="content" class="modal--side-nav">
      <NavMenu v-model="selectedFilterName">
        <v-form-group
          v-if="isVisualSource"
          :value="presetFilterValue"
          :metadata="presetFilterMetadata"
          @input="value => addPresetFilter(value)"
        />
        <div class="controls">
          <i class="icon-add icon-button" @click="addFilter"></i>
          <i class="icon-subtract icon-button" v-if="selectedFilterName" @click="removeFilter"></i>
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
                <i
                  @click="toggleVisibility(node.title)"
                  class="icon-view"
                  v-if="node.data.visible"
                ></i>
                <i
                  @click="toggleVisibility(node.title)"
                  class="icon-hide"
                  v-if="!node.data.visible"
                ></i>
              </span>
              &nbsp;
              <span class="item-title">{{ node.title }}</span>
            </div>
          </template>
        </sl-vue-tree>
      </NavMenu>

      <scrollable className="modal-container--side-nav" :isResizable="false">
        <div v-if="selectedFilterName && selectedFilterName !== '__PRESET'">
          <GenericForm
            v-if="properties.length"
            v-model="properties"
            @input="save"
            :key="selectedFilterName"
          ></GenericForm>
          <div v-else>{{ $t('No settings are available for this filter') }}</div>
        </div>
        <div v-if="!selectedFilterName">
          {{ $t('No filters applied') }}
        </div>
      </scrollable>
    </div>
  </modal-layout>
</template>

<script lang="ts" src="./SourceFilters.vue.ts"></script>

<style lang="less" scoped>
@import '~sl-vue-tree/dist/sl-vue-tree-dark.css';
@import '../../styles/index';

.modal-container--side-nav {
  .padding(2);

  flex-grow: 1;
  margin: -16px -16px -16px 0;
}

.modal--side-nav {
  display: flex;
  align-content: stretch;
  align-items: stretch;
  height: 100%;
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
