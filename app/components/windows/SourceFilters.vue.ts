import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import SlVueTree, { ISlTreeNodeModel, ICursorPosition } from 'sl-vue-tree';
import { Inject } from 'services/core/injector';
import { WindowsService } from 'services/windows';
import { SourceFiltersService } from 'services/source-filters';
import { SourcesService } from 'services/sources';
import { EditorCommandsService } from 'services/editor-commands';

import ModalLayout from 'components/ModalLayout.vue';
import NavMenu from 'components/shared/NavMenu.vue';
import NavItem from 'components/shared/NavItem.vue';
import Display from 'components/shared/Display.vue';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import GenericForm from 'components/obs/inputs/GenericForm';
import { Subscription } from 'rxjs';
import Scrollable from 'components/shared/Scrollable';
import { $t } from 'services/i18n';
import { TObsValue } from 'components/obs/inputs/ObsInput';

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
    Scrollable,
    VFormGroup,
  },
})
export default class SourceFilters extends Vue {
  @Inject() sourceFiltersService: SourceFiltersService;
  @Inject() sourcesService: SourcesService;
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
  updateFilterSub: Subscription;
  reorderFilterSub: Subscription;
  presetFilterValue: TObsValue = '';

  mounted() {
    this.addFilterSub = this.sourceFiltersService.filterAdded.subscribe(() => {
      this.refreshFilters();
    });
    this.removeFilterSub = this.sourceFiltersService.filterRemoved.subscribe(filter => {
      this.refreshFilters();
      if (this.selectedFilterName === filter.name) {
        this.selectedFilterName = (this.filters[0] && this.filters[0].name) || null;
      }
    });
    this.updateFilterSub = this.sourceFiltersService.filterUpdated.subscribe(filter => {
      this.refreshFilters();
      if (this.selectedFilterName === filter.name && this.sourceId === filter.sourceId) {
        this.updateProperties();
      }
    });
    this.reorderFilterSub = this.sourceFiltersService.filtersReordered.subscribe(() =>
      this.refreshFilters(),
    );

    const preset = this.sourceFiltersService.presetFilter(this.sourceId);
    if (preset) {
      this.presetFilterValue = this.sourceFiltersService.views.parsePresetValue(
        String(preset.settings.image_path),
      );
    }
  }

  destroyed() {
    this.addFilterSub.unsubscribe();
    this.removeFilterSub.unsubscribe();
    this.updateFilterSub.unsubscribe();
    this.reorderFilterSub.unsubscribe();
  }

  get isVisualSource() {
    const source = this.sourcesService.views.getSource(this.sourceId);
    if (!source) return false;
    return source.video;
  }

  get presetFilterOptions() {
    return this.sourceFiltersService.views.presetFilterOptions;
  }

  get presetFilterMetadata() {
    return this.sourceFiltersService.views.presetFilterMetadata;
  }

  addPresetFilter(value: string) {
    this.presetFilterValue = value;
    if (value === '') {
      this.sourceFiltersService.remove(this.sourceId, '__PRESET');
    } else {
      this.sourceFiltersService.addPresetFilter(this.sourceId, value);
    }
  }

  @Watch('selectedFilterName')
  updateProperties() {
    this.properties = this.sourceFiltersService.getPropertiesFormData(
      this.sourceId,
      this.selectedFilterName,
    );
  }

  save() {
    this.editorCommandsService.executeCommand(
      'EditFilterPropertiesCommand',
      this.sourceId,
      this.selectedFilterName,
      this.properties,
    );
  }

  done() {
    this.windowsService.closeChildWindow();
  }

  addFilter() {
    this.sourceFiltersService.showAddSourceFilter(this.sourceId);
  }

  get sourceDisplayName() {
    return this.sourcesService.views.getSource(this.sourceId).name;
  }

  get nodes() {
    return this.filters
      .filter(filter => filter.name !== '__PRESET')
      .map(filter => {
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
    this.editorCommandsService.executeCommand('ToggleFilterCommand', this.sourceId, filterName);
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
    const presetInd = this.filters.findIndex(filter => filter.name === '__PRESET');
    let targetInd = this.filters.findIndex(filter => filter.name === position.node.title);
    if (sourceInd < targetInd) {
      targetInd = position.placement === 'before' ? targetInd - 1 : targetInd;
    } else if (sourceInd > targetInd) {
      targetInd = position.placement === 'before' ? targetInd : targetInd + 1;
    }
    if (presetInd === targetInd) {
      targetInd = targetInd - 1;
    }

    this.editorCommandsService.executeCommand(
      'ReorderFiltersCommand',
      this.sourceId,
      this.selectedFilterName,
      targetInd - sourceInd,
    );
  }

  private refreshFilters() {
    this.filters = this.sourceFiltersService.getFilters(this.sourceId);
  }
}
