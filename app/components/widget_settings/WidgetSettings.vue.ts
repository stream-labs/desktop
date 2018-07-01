import Vue from 'vue';
import { Inject } from '../../util/injector';
import { Component, Watch } from 'vue-property-decorator';
import { WindowsService } from 'services/windows';
import { debounce } from 'lodash-decorators';
import { SourcesService } from 'services/sources';
import { WidgetsService, WidgetType } from 'services/widgets';
import { THttpMethod, WidgetSettingsService } from 'services/widget-settings/widget-settings';



@Component({})
export default class WidgetSettings<TData, TService extends WidgetSettingsService<TData>> extends Vue {

  @Inject() windowsService: WindowsService;
  @Inject() sourcesService: SourcesService;
  @Inject() widgetsService: WidgetsService;


  tabName: string = '';
  sourceId = this.windowsService.getChildWindowOptions().queryParams.sourceId;
  source = this.sourcesService.getSource(this.sourceId);
  data: TData = null;
  metadata = this.service.getMetadata();
  loadingState: 'success' | 'pending' | 'fail' = 'pending';

  get widgetType(): WidgetType {
    return this.source.getPropertiesManagerSettings().widgetType;
  }

  get service(): TService {
    return this.widgetsService.getWidgetSettingsService(this.widgetType) as TService;
  }

  protected autosaveIsDisabled = false;

  async mounted() {
    this.refresh();
  }

  async refresh() {
    try {
      this.data = await this.service.fetchData();
      this.loadingState = 'success';
      this.afterFetch();
    } catch (e) {
      this.loadingState = 'fail';
    }
  }

  @debounce(1000)
  @Watch('data', { deep: true })
  async onDataChangeHandler() {
    const tab = this.service.getTab(this.tabName);
    if (!tab) return;

    const needToSave = tab.autosave && !this.autosaveIsDisabled;

    if (!needToSave) {
      this.autosaveIsDisabled = false;
      return;
    }

    await this.save();
    this.autosaveIsDisabled = true;
  }

  async save() {
    if (this.loadingState === 'pending') return;

    const tab = this.service.getTab(this.tabName);
    if (!tab) return;

    this.loadingState = 'pending';

    try {
      const data = await this.service.saveData(this.data[tab.name], tab.name);
      Vue.set(this, 'data', data);
      this.loadingState = 'success';
      this.afterFetch();
      this.refreshPreview();
    } catch (e) {
      this.loadingState = 'fail';
      this.onFailHandler();
    }
  }

  async reset() {
    if (this.loadingState === 'pending') return;

    this.loadingState = 'pending';

    try {
      this.data = await this.service.reset(this.tabName);
      this.loadingState = 'success';
      this.afterFetch();
      this.refreshPreview();
    } catch (e) {
      this.loadingState = 'fail';
      this.onFailHandler();
    }
  }

  refreshPreview() {
    // little hack: update some property to trigger preview refreshing
    const height = this.source.height;
    this.source.updateSettings({ height: height + 1 });
    this.source.updateSettings({ height });
  }

  afterFetch() {

  }

  onFailHandler() {
    // TODO: replace alert with UI component
    alert('Something went wrong');
  }
}
