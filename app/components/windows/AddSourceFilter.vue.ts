import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { WindowsService } from 'services/windows';
import { SourceFiltersService } from 'services/source-filters';
import { EditorCommandsService } from 'services/editor-commands';

import ModalLayout from '../ModalLayout.vue';
import { $t } from 'services/i18n';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';

@Component({
  components: { ModalLayout, VFormGroup },
})
export default class AddSourceFilter extends Vue {
  @Inject() private windowsService: WindowsService;
  @Inject() private editorCommandsService: EditorCommandsService;

  @Inject('SourceFiltersService')
  filtersService: SourceFiltersService;

  sourceId: string = this.windowsService.getChildWindowQueryParams().sourceId;
  form = this.filtersService.getAddNewFormData(this.sourceId);
  availableTypes = this.filtersService.getTypesForSource(this.sourceId);
  error = '';

  mounted() {
    this.setTypeAsName();
  }

  done() {
    const name = this.form.name;
    this.error = this.validateName(name);
    if (this.error) return;

    this.editorCommandsService.executeCommand(
      'AddFilterCommand',
      this.sourceId,
      this.form.type,
      name,
    );

    this.filtersService.showSourceFilters(this.sourceId, name);
  }

  cancel() {
    this.filtersService.showSourceFilters(this.sourceId);
  }

  validateName(name: string) {
    if (!name) return $t('Name is required');
    if (this.filtersService.getFilters(this.sourceId).find(filter => filter.name === name)) {
      return $t('That name is already taken');
    }
    return '';
  }

  get typeOptions() {
    return this.filtersService
      .getTypesForSource(this.sourceId)
      .map(filterType => ({ title: filterType.description, value: filterType.type }));
  }

  setTypeAsName() {
    const name = this.availableTypes.find(({ type }) => {
      return type === this.form.type;
    }).description;
    this.form.name = this.filtersService.suggestName(this.sourceId, name);
  }
}
