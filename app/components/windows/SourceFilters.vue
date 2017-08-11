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
import { Inject } from '../../util/injector';
import { WindowService } from '../../services/window';
import windowMixin from '../mixins/window';
import SourceFiltersService from '../../services/source-filters';
import { SourcesService } from '../../services/sources';

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
  SourceFiltersService: SourceFiltersService;

  @Inject()
  sourcesService: SourcesService;

  windowService = WindowService.instance;

  windowOptions: { sourceName: string, selectedFilterName: string } = this.windowService.getOptions();
  sourceName = this.windowOptions.sourceName;
  filters = this.SourceFiltersService.getFilters(this.sourceName);
  selectedFilterName = this.windowOptions.selectedFilterName || (this.filters[0] && this.filters[0].name) || null;
  properties = this.SourceFiltersService.getPropertiesFormData(
    this.sourceName, this.selectedFilterName
  );

  @Watch('selectedFilterName')
  onSelectedFilterChanged() {
    this.save();
  }

  save() {
    this.SourceFiltersService.setProperties(
      this.sourceName,
      this.selectedFilterName,
      this.properties
    );
    this.properties = this.SourceFiltersService.getPropertiesFormData(
      this.sourceName, this.selectedFilterName
    );
  }

  done() {
    this.windowService.closeWindow();
  }

  addFilter() {
    this.windowService.showAddSourceFilter(this.sourceName);
  }

  get sourceDisplayName() {
    return this.sourcesService.getSourceByName(this.sourceName).displayName;
  }

  removeFilter() {
    this.SourceFiltersService.remove(this.sourceName, this.selectedFilterName);
    this.filters = this.SourceFiltersService.getFilters(this.sourceName);
    this.selectedFilterName = (this.filters[0] && this.filters[0].name) || null;
  }

  toggleVisibility(filterName: string) {
    const sourceFilter = this.filters.find(filter => filter.name === filterName);
    this.SourceFiltersService.setVisibility(this.sourceName, sourceFilter.name, !sourceFilter.visible);
    this.filters = this.SourceFiltersService.getFilters(this.sourceName);
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
