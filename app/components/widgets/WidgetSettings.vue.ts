import Vue from 'vue';
import cloneDeep from 'lodash/cloneDeep';
import { Inject } from '../../services/core/injector';
import { WindowsService } from 'services/windows';
import { IWidgetData, IWidgetsServiceApi, WidgetSettingsService } from 'services/widgets';
import { Subscription } from 'rxjs';
import { $t } from 'services/i18n/index';
import { Component } from 'vue-property-decorator';
import { Debounce } from 'lodash-decorators';

export interface IWidgetNavItem {
  value: string;
  label: string;
}

@Component({})
export default class WidgetSettings<
  TData extends IWidgetData,
  TService extends WidgetSettingsService<TData>
> extends Vue {
  @Inject() private windowsService: WindowsService;
  @Inject() private widgetsService: IWidgetsServiceApi;

  service: TService;
  sourceId = this.windowsService.getChildWindowOptions().queryParams.sourceId;
  widget = this.widgetsService.getWidgetSource(this.sourceId);
  wData: TData = null;
  tab = 'settings';
  requestState: 'success' | 'pending' | 'fail' = 'pending';

  fontFamilyTooltip = $t(
    'The Google Font to use for the text. Visit http://google.com/fonts to find one! Popular Fonts include:' +
      ' Open Sans, Roboto, Oswald, Lato, and Droid Sans.',
  );

  navItems: IWidgetNavItem[];

  private lastSuccessfullySavedWData: TData = null;
  private dataUpdatedSubscr: Subscription;
  private pendingRequests = 0;

  get metadata() {
    return this.service.getMetadata();
  }

  async created() {
    this.service = this.widget.getSettingsService() as TService;
    try {
      this.wData = await this.service.fetchData();
      this.lastSuccessfullySavedWData = cloneDeep(this.wData);
      this.requestState = 'success';
      this.afterFetch();
    } catch (e) {
      this.requestState = 'fail';
    }
  }

  mounted() {
    this.dataUpdatedSubscr = this.service.dataUpdated.subscribe(newData => {
      this.onDataUpdatedHandler(newData);
    });
  }

  get loaded() {
    return !!this.wData;
  }

  destroyed() {
    this.dataUpdatedSubscr.unsubscribe();
  }

  private onDataUpdatedHandler(data: TData) {
    this.lastSuccessfullySavedWData = data;
    if (!this.pendingRequests) {
      this.wData = cloneDeep(this.lastSuccessfullySavedWData);
      this.widget.refresh();
    }
  }

  @Debounce(500)
  async save() {
    this.pendingRequests++;
    try {
      await this.service.saveSettings(this.wData.settings);
      this.requestState = 'success';
    } catch (e) {
      const errorMessage = e && e.message ? e.message : $t('Save failed, something went wrong.');
      this.onDataUpdatedHandler(this.lastSuccessfullySavedWData);
      this.requestState = 'fail';
      this.onFailHandler(errorMessage);
    }
    this.pendingRequests--;
  }

  onFailHandler(msg: string) {
    this.$toasted.show(msg, {
      position: 'bottom-center',
      className: 'toast-alert',
      duration: 3000,
      singleton: true,
    });
  }

  protected afterFetch() {
    // override me if you need
  }
}
