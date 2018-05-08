<template>
  <modal-layout
    :title="'Layer filters (' + sourceDisplayName + ')'"
    :show-cancel="false"
    :done-handler="done"
    :fixedSectionHeight="250"
  >
    <display slot="fixed" :sourceId="sourceId" />

    <div slot="content" class="modal--side-nav">
      <NavMenu v-model="selectedFilterName" class="side-menu">
        <div class="controls">
          <i
            class="icon-add icon-btn"
            @click="addFilter"></i>
          <i
            class="icon-subtract icon-btn"
            v-if="selectedFilterName"
            @click="removeFilter"></i>
        </div>
        <NavItem
          v-for="filter in filters"
          :key="filter.name"
          :to="filter.name"
          :ico="filter.visible ? 'icon-view' : 'icon-hide'"
          @iconClick="toggleVisibility">
          {{ filter.name }}
        </NavItem>
      </NavMenu>

      <div class="modal-container--side-nav">
        <div v-if="selectedFilterName">
          <GenericForm v-model="properties" @input="save"></GenericForm>
        </div>
        <div v-if="!selectedFilterName">
          No filters applied
        </div>
      </div>
    </div>
  </modal-layout>
</template>

<script lang="ts" src="./SourceFilters.vue.ts"></script>

<style lang="less" scoped>
.modal-container--side-nav {
  padding: 20px;
}

.controls {
  margin-left: 13px;
  margin-bottom: 20px;
}
</style>
