import Vue from 'vue';
import { Inject } from '../../util/injector';
import { Component, Watch } from 'vue-property-decorator';
import { WindowsService } from 'services/windows';
import { debounce } from 'lodash-decorators';
import { SourcesService } from 'services/sources/index';
import { WidgetsService, WidgetType } from 'services/widgets';
import { IWidgetData, WidgetSettingsService } from 'services/widget-settings/widget-settings';
import { Subscription } from 'rxjs/Subscription';
import { $t } from 'services/i18n/index';

@Component({})
export default class WidgetSettings<TData extends IWidgetData, TService extends WidgetSettingsService<TData>>
  extends Vue {

  @Inject() private windowsService: WindowsService;
  @Inject() private sourcesService: SourcesService;
  @Inject() private widgetsService: WidgetsService;

  tabName: string = '';
  sourceId = this.windowsService.getChildWindowOptions().queryParams.sourceId;
  source = this.sourcesService.getSource(this.sourceId);
  wData: TData = null;
  metadata = this.service.getMetadata();

  requestState: 'success' | 'pending' | 'fail' = 'pending';

  tabs = this.service.getTabs();

  fontFamilyTooltip = $t(
    'The Google Font to use for the text. Visit http://google.com/fonts to find one! Popular Fonts include:' + 
      ' Open Sans, Roboto, Oswald, Lato, and Droid Sans.'
  );


  private dataUpdatedSubscr: Subscription;

  get widgetType(): WidgetType {
    return this.source.getPropertiesManagerSettings().widgetType;
  }

  get service(): TService {
    return this.widgetsService.getWidgetSettingsService(this.widgetType) as TService;
  }

  protected skipNextDatachangeHandler: boolean;

  async created() {
    this.tabName = this.tabName || this.tabs[0].name;
    this.dataUpdatedSubscr = this.service.dataUpdated.subscribe(newData => {
      this.onDataUpdatedHandler(newData);
    });
    await this.refresh();
  }

  get loaded() {
    return !!this.wData;
  }

  destroyed() {
    this.dataUpdatedSubscr.unsubscribe();
  }

  async refresh() {
    try {
      await this.service.fetchData();
      this.requestState = 'success';
      this.skipNextDatachangeHandler = true;
      this.afterFetch();
    } catch (e) {
      this.requestState = 'fail';
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

  private onDataUpdatedHandler(newData: TData) {
    this.wData = newData;
    this.refreshPreview();
  }

  async save(dataToSave?: any) {
    if (this.requestState === 'pending') return;

    const tab = this.service.getTab(this.tabName);
    if (!tab) return;

    this.requestState = 'pending';

    try {
      await this.service.saveData(dataToSave || this.wData[tab.name], tab.name);
      this.requestState = 'success';
      this.afterFetch();
      this.skipNextDatachangeHandler = true;
    } catch (e) {
      this.requestState = 'fail';
      this.onFailHandler();
    }
  }

  async reset() {
    if (this.requestState === 'pending') return;

    this.requestState = 'pending';

    try {
      this.wData = await this.service.reset(this.tabName);
      this.requestState = 'success';
      this.afterFetch();
      this.skipNextDatachangeHandler = true;
    } catch (e) {
      this.requestState = 'fail';
      this.onFailHandler();
    }
  }

  refreshPreview() {
    this.source.refresh();
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
