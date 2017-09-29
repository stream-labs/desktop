import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import { WindowsService } from '../../services/windows';
import windowMixin from '../mixins/window';
import { SourceFiltersService } from '../../services/source-filters';
import { ISourcesServiceApi } from '../../services/sources';

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
  sourceFiltersService: SourceFiltersService;

  @Inject()
  sourcesService: ISourcesServiceApi;

  @Inject()
  windowsService: WindowsService;

  windowOptions = this.windowsService.getChildWindowQueryParams() as { sourceName: string, selectedFilterName: string };
  sourceName = this.windowOptions.sourceName;
  filters = this.sourceFiltersService.getFilters(this.sourceName);
  selectedFilterName = this.windowOptions.selectedFilterName || (this.filters[0] && this.filters[0].name) || null;
  properties = this.sourceFiltersService.getPropertiesFormData(
    this.sourceName, this.selectedFilterName
  );

  @Watch('selectedFilterName')
  updateProperties() {
    this.properties = this.sourceFiltersService.getPropertiesFormData(
      this.sourceName, this.selectedFilterName
    );
  }

  save() {
    this.sourceFiltersService.setPropertiesFormData(
      this.sourceName,
      this.selectedFilterName,
      this.properties
    );
    this.updateProperties();
  }

  done() {
    this.windowsService.closeChildWindow();
  }

  addFilter() {
    this.sourceFiltersService.showAddSourceFilter(this.sourceName);
  }

  get sourceDisplayName() {
    return this.sourcesService.getSourceByName(this.sourceName).displayName;
  }

  removeFilter() {
    this.sourceFiltersService.remove(this.sourceName, this.selectedFilterName);
    this.filters = this.sourceFiltersService.getFilters(this.sourceName);
    this.selectedFilterName = (this.filters[0] && this.filters[0].name) || null;
  }

  toggleVisibility(filterName: string) {
    const sourceFilter = this.filters.find(filter => filter.name === filterName);
    this.sourceFiltersService.setVisibility(this.sourceName, sourceFilter.name, !sourceFilter.visible);
    this.filters = this.sourceFiltersService.getFilters(this.sourceName);
  }

}
