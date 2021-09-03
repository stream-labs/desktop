import { useModule, useModuleByName, useModuleRoot } from '../hooks/useModule';
import { WidgetType } from '../../services/widgets';
import { WidgetSettingsBaseService } from '../../services/widgets/settings/widget-settings-base';
import { Services } from '../service-provider';
import { mutation } from '../store';
import { components } from './Widget';
import Utils from '../../services/utils';

// export function useWidget<T extends typeof WidgetModule>(Module: T, sourceId?: string) {
//   return useModule(Module, { sourceId }).select();
// }

export function useWidgetRoot<T extends typeof WidgetModule>(Module: T, sourceId?: string) {
  return useModuleRoot(Module, { sourceId }, 'WidgetModule').select();
}

export function useWidget<TModule extends WidgetModule>() {
  return useModuleByName<TModule>('WidgetModule').select();
}

export interface IWidgetDisplaySettings {
  sourceId: string;
  isVisible: boolean;
}

export const DEFAULT_WIDGET_STATE = {
  isLoading: true,
  sourceId: '',
  previewSourceId: '',
  isPreviewVisible: false,
  selectedTab: '',
  type: '',
  settings: {} as Record<string, unknown>,
};

export class WidgetModule {
  state = { ...DEFAULT_WIDGET_STATE };

  async init(params: { sourceId: string }) {
    this.state.sourceId = params.sourceId;
    const widget = this.widget;

    // create a temporary preview-source for the Display component
    const previewSource = widget.createPreviewSource();
    this.state.type = WidgetType[widget.type];
    this.state.previewSourceId = previewSource.sourceId;
    const settings = await this.widgetService.fetchSettings();
    this.setSettings(settings);
    this.setPreviewVisibility(true);
  }

  destroy() {
    this.widget.destroyPreviewSource();
  }

  public get WidgetComponent() {
    return components[this.state.type];
  }

  private get widgetService(): WidgetSettingsBaseService {
    return (this.widget.getSettingsService() as unknown) as WidgetSettingsBaseService;
  }

  private get widget() {
    return Services.WidgetsService.getWidgetSource(this.state.sourceId);
  }

  async toggleTab(tabName: string) {
    const currentTabName = this.state.selectedTab;
    if (currentTabName === tabName) {
      tabName = '';
    }
    this.setSelectedTab(tabName);

    const shouldAnimateSider = (!currentTabName && tabName) || (currentTabName && !tabName);
    if (!shouldAnimateSider) return;

    this.setPreviewVisibility(false);
    await Utils.sleep(300);
    this.setPreviewVisibility(true);
  }

  @mutation()
  private setSelectedTab(name: string) {
    this.state.selectedTab = name;
  }

  @mutation()
  private setPreviewVisibility(isVisible: boolean) {
    this.state.isPreviewVisible = isVisible;
  }

  @mutation()
  private setSettings(settings: Record<string, unknown>) {
    console.log('settings fetched', settings);
    this.state.settings = settings.settings as Record<string, unknown>;
  }
}
