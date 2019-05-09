import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import SlVueTree, { ISlTreeNodeModel, ICursorPosition } from 'sl-vue-tree';
import { Inject } from 'services/core/injector';
import { WindowsService } from 'services/windows';
import { SourceFiltersService } from 'services/source-filters';
import { ISourcesServiceApi } from 'services/sources';
import { EditorCommandsService } from 'services/editor-commands';

import ModalLayout from 'components/ModalLayout.vue';
import NavMenu from 'components/shared/NavMenu.vue';
import NavItem from 'components/shared/NavItem.vue';
import Display from 'components/shared/Display.vue';
import GenericForm from 'components/obs/inputs/GenericForm.vue';
import { Subscription } from 'rxjs';

interface IFilterNodeData {
  visible: boolean;
}

@Component({
  components: {
    ModalLayout,
    NavMenu,
    NavItem,
    GenericForm,
    Display,
    SlVueTree,
  },
})
export default class SourceFilters extends Vue {
  @Inject() sourceFiltersService: SourceFiltersService;
  @Inject() sourcesService: ISourcesServiceApi;
  @Inject() windowsService: WindowsService;
  @Inject() private editorCommandsService: EditorCommandsService;

  windowOptions = this.windowsService.getChildWindowQueryParams() as {
    sourceId: string;
    selectedFilterName: string;
  };
  sourceId = this.windowOptions.sourceId;
  filters = this.sourceFiltersService.getFilters(this.sourceId);
  selectedFilterName =
    this.windowOptions.selectedFilterName || (this.filters[0] && this.filters[0].name) || null;
  properties = this.sourceFiltersService.getPropertiesFormData(
    this.sourceId,
    this.selectedFilterName,
  );

  addFilterSub: Subscription;
  removeFilterSub: Subscription;

  mounted() {
    this.addFilterSub = this.sourceFiltersService.filterAdded.subscribe(() =>
      this.refreshFilters(),
    );
    this.removeFilterSub = this.sourceFiltersService.filterRemoved.subscribe(filter => {
      this.refreshFilters();
      if (this.selectedFilterName === filter.name) {
        this.selectedFilterName = (this.filters[0] && this.filters[0].name) || null;
      }
    });
  }

  destroyed() {
    this.addFilterSub.unsubscribe();
    this.removeFilterSub.unsubscribe();
  }

  @Watch('selectedFilterName')
  updateProperties() {
    this.properties = this.sourceFiltersService.getPropertiesFormData(
      this.sourceId,
      this.selectedFilterName,
    );
  }

  save() {
    this.sourceFiltersService.setPropertiesFormData(
      this.sourceId,
      this.selectedFilterName,
      this.properties,
    );
    this.updateProperties();
  }

  done() {
    this.windowsService.closeChildWindow();
  }

  addFilter() {
    this.sourceFiltersService.showAddSourceFilter(this.sourceId);
  }

  get sourceDisplayName() {
    return this.sourcesService.getSource(this.sourceId).name;
  }

  get nodes() {
    return this.filters.map(filter => {
      return {
        title: filter.name,
        isSelected: filter.name === this.selectedFilterName,
        isLeaf: true,
        data: {
          visible: filter.visible,
        },
      };
    });
  }

  removeFilter() {
    this.editorCommandsService.executeCommand(
      'RemoveFilterCommand',
      this.sourceId,
      this.selectedFilterName,
    );
  }

  toggleVisibility(filterName: string) {
    const sourceFilter = this.filters.find(filter => filter.name === filterName);
    this.sourceFiltersService.setVisibility(
      this.sourceId,
      sourceFilter.name,
      !sourceFilter.visible,
    );
    this.filters = this.sourceFiltersService.getFilters(this.sourceId);
  }

  makeActive(filterDescr: any[]) {
    this.selectedFilterName = filterDescr[0].title;
  }

  handleSort(
    nodes: ISlTreeNodeModel<IFilterNodeData>[],
    position: ICursorPosition<IFilterNodeData>,
  ) {
    const sourceNode = nodes[0];
    const sourceInd = this.filters.findIndex(filter => filter.name === sourceNode.title);
    let targetInd = this.filters.findIndex(filter => filter.name === position.node.title);

    if (sourceInd < targetInd) {
      targetInd = position.placement === 'before' ? targetInd - 1 : targetInd;
    } else if (sourceInd > targetInd) {
      targetInd = position.placement === 'before' ? targetInd : targetInd + 1;
    }
    this.sourceFiltersService.setOrder(
      this.sourceId,
      this.selectedFilterName,
      targetInd - sourceInd,
    );
    this.filters = this.sourceFiltersService.getFilters(this.sourceId);
  }

  private refreshFilters() {
    this.filters = this.sourceFiltersService.getFilters(this.sourceId);
  }
}
