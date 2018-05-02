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
          <div class="fa fa-plus icon-btn" @click="addFilter"></div>
          <div
            class="fa fa-minus icon-btn"
            v-if="selectedFilterName"
            @click="removeFilter">
          </div>
        </div>
        <NavItem
          v-for="filter in filters"
          :key="filter.name"
          :to="filter.name"
          :ico="filter.visible ? 'eye' : 'eye-slash'"
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
