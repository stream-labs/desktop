<template>
  <modal-layout
    :title="'Source filters (' + sourceDisplayName + ')'"
    :show-cancel="false"
    :done-handler="done"
    :fixedSectionHeight="250"
  >
    <SourcePreview slot="fixed" :sourceName="sourceName"></SourcePreview>

    <div slot="content">
      <div class="row">
        <div class="columns small-3">

          <div class="side-menu">
            <NavMenu v-model="selectedFilterName">
              <NavItem
                v-for="filter in filters"
                :to="filter.name"
                :ico="filter.visible ? 'eye' : 'eye-slash'"
                @iconClick="toggleVisibility">
                {{ filter.name }}
              </NavItem>
            </NavMenu>
            <div class="controls">
              <div class="fa fa-plus icon-btn" @click="addFilter"></div>
              <div
                class="fa fa-minus icon-btn"
                v-if="selectedFilterName"
                @click="removeFilter"
              >
              </div>
            </div>
          </div>

        </div>
        <div class="columns small-9">
          <div v-if="selectedFilterName">
            <GenericForm v-model="properties" @input="save"></GenericForm>
          </div>
          <div v-if="!selectedFilterName">
            No filters applied
          </div>
        </div>
      </div>
    </div>

  </modal-layout>
</template>

<script lang="ts" src="./SourceFilters.vue.ts"></script>

<style lang="less" scoped>
.side-menu {
  position: fixed;
  left: 0;
}

.controls {
  margin-left: 15px;
  margin-top: 15px;
}
</style>
