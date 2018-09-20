import Vue from 'vue';
import { cloneDeep } from 'lodash';
import { Inject } from '../../util/injector';
import { WindowsService } from 'services/windows';
import { IWidgetsServiceApi } from 'services/widgets';
import { IWidgetData, WidgetSettingsService } from 'services/widgets';
import { Subscription } from 'rxjs/Subscription';
import { $t } from 'services/i18n/index';
import { Component } from 'vue-property-decorator';

export interface IWidgetNavItem {
  value: string;
  label: string;
}

@Component({})
export default class WidgetSettings<TData extends IWidgetData, TService extends WidgetSettingsService<TData>>
  extends Vue {

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
      ' Open Sans, Roboto, Oswald, Lato, and Droid Sans.'
  );

  navItems: IWidgetNavItem[];

  private lastSuccessfullySavedWData: TData = null;
  private dataUpdatedSubscr: Subscription;

  get metadata() {
    return this.service.getMetadata();
  }

  async created() {
    console.log('call created');
    this.service = this.widget.getSettingsService() as TService;
    try {
      console.log('try loading');
      this.wData = await this.service.fetchData();
      this.lastSuccessfullySavedWData = cloneDeep(this.wData);
      this.requestState = 'success';

      console.log('success, call afterFetch');
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
    this.wData = data;
    this.lastSuccessfullySavedWData = cloneDeep(this.wData);
    this.widget.refresh();
  }

  async save() {
    if (this.requestState === 'pending') return;
    try {
      await this.service.saveSettings(this.wData.settings);
      this.requestState = 'success';
    } catch (e) {
      // rollback settings
      this.wData = cloneDeep(this.lastSuccessfullySavedWData);
      this.requestState = 'fail';
      this.onFailHandler();
    }
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

  protected afterFetch() {
    // override me

    console.log('not overrode afterFetch');
  };
}
