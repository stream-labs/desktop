import Vue from 'vue';
import { Inject } from '../../util/injector';
import { Component, Watch } from 'vue-property-decorator';
import { WindowsService } from 'services/windows';
import { debounce } from 'lodash-decorators';
import { SourcesService } from 'services/sources';
import { WidgetsService, WidgetType } from 'services/widgets';
import { WidgetSettingsService } from 'services/widget-settings/widget-settings';
import { $t } from 'services/i18n';

@Component({})
export default class WidgetSettings<TData, TService extends WidgetSettingsService<TData>> extends Vue {

  @Inject() windowsService: WindowsService;
  @Inject() sourcesService: SourcesService;
  @Inject() widgetsService: WidgetsService;


  tabName: string = '';
  sourceId = this.windowsService.getChildWindowOptions().queryParams.sourceId;
  source = this.sourcesService.getSource(this.sourceId);
  wData: TData = null;
  metadata = this.service.getMetadata();
  loadingState: 'success' | 'pending' | 'fail' = 'pending';

  get widgetType(): WidgetType {
    return this.source.getPropertiesManagerSettings().widgetType;
  }

  get service(): TService {
    return this.widgetsService.getWidgetSettingsService(this.widgetType) as TService;
  }

  protected skipNextDatachangeHandler: boolean;

  async mounted() {
    await this.refresh();
  }

  async refresh() {
    try {
      this.wData = await this.service.fetchData();
      this.loadingState = 'success';
      this.afterFetch();
      this.skipNextDatachangeHandler = true;
    } catch (e) {
      this.loadingState = 'fail';
    }
  }

  @debounce(1000)
  @Watch('wData', { deep: true })
  async onDataChangeHandler() {
    const tab = this.service.getTab(this.tabName);
    if (!tab) return;

    const needToSave = tab.autosave && !this.skipNextDatachangeHandler;
    if (this.skipNextDatachangeHandler) this.skipNextDatachangeHandler = false;

    if (!needToSave) return;
    await this.save();
  }

  async save() {
    if (this.loadingState === 'pending') return;

    const tab = this.service.getTab(this.tabName);
    if (!tab) return;

    this.loadingState = 'pending';

    try {
      this.wData = await this.service.saveData(this.wData[tab.name], tab.name);
      this.loadingState = 'success';
      this.afterFetch();
      this.refreshPreview();
      this.skipNextDatachangeHandler = true;
    } catch (e) {
      this.loadingState = 'fail';
      this.onFailHandler();
    }
  }

  async reset() {
    if (this.loadingState === 'pending') return;

    this.loadingState = 'pending';

    try {
      this.wData = await this.service.reset(this.tabName);
      this.loadingState = 'success';
      this.afterFetch();
      this.refreshPreview();
      this.skipNextDatachangeHandler = true;
    } catch (e) {
      this.loadingState = 'fail';
      this.onFailHandler();
    }
  }

  refreshPreview() {

    // update obs-preview
    // little hack: update some property to trigger preview refreshing
    const height = this.source.height;
    this.source.updateSettings({ height: height + 1 });
    this.source.updateSettings({ height });
  }

  afterFetch() {

  }

  onFailHandler() {
    this.$toasted.show(
      $t('Save failed, something went wrong.'),
      {
        position: 'bottom-center',
        className: 'toast-alert',
        duration: 1000,
        singleton: true
      }
    );
  }
}
