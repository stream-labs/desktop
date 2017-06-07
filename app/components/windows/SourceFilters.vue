<template>
  <modal-layout
    :title="'Source filters (' + sourceName + ')'"
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
              <div class="fa fa-plus ico-btn" @click="addFilter"></div>
              <div
                class="fa fa-minus ico-btn"
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

<script lang="ts">
import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from '../../services/service';
import windowManager from '../../util/WindowManager';
import windowMixin from '../mixins/window';
import SourceFiltersService from '../../services/source-filters';

import ModalLayout from '../ModalLayout.vue';
import NavMenu from '../shared/NavMenu.vue';
import NavItem from '../shared/NavItem.vue';
import SourcePreview from '../shared/SourcePreview.vue';
import GenericForm from '../shared/forms/GenericForm.vue';

@Component({
  components: {
    ModalLayout,
    NavMenu,
    NavItem,
    GenericForm,
    SourcePreview,
  },
  mixins: [windowMixin]
})
export default class SourceFilters extends Vue {

  @Inject()
  filtersService: SourceFiltersService;

  windowOptions: { sourceName: string, selectedFilterName: string } = windowManager.getOptions();
  sourceName = this.windowOptions.sourceName;
  filters = this.filtersService.getFilters(this.sourceName);
  selectedFilterName = this.windowOptions.selectedFilterName || (this.filters[0] && this.filters[0].name) || null;
  properties = this.filtersService.getPropertiesFormData(
    this.sourceName, this.selectedFilterName
  );

  @Watch('selectedFilterName')
  onSelectedFilterChanged() {
    this.save();
  }

  save() {
    this.filtersService.setProperties(
      this.sourceName,
      this.selectedFilterName,
      this.properties
    );
    this.properties = this.filtersService.getPropertiesFormData(
      this.sourceName, this.selectedFilterName
    );
  }


  done() {
    windowManager.closeWindow();
  }


  addFilter() {
    windowManager.showAddSourceFilter(this.sourceName);
  }


  removeFilter() {
    this.filtersService.remove(this.sourceName, this.selectedFilterName);
    this.filters = this.filtersService.getFilters(this.sourceName);
    this.selectedFilterName = (this.filters[0] && this.filters[0].name) || null;
  }

  toggleVisibility(filterName: string) {
    const sourceFilter = this.filters.find(filter => filter.name === filterName);
    this.filtersService.setVisibility(this.sourceName, sourceFilter.name, !sourceFilter.visible);
    this.filters = this.filtersService.getFilters(this.sourceName);
  }
}
</script>

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
