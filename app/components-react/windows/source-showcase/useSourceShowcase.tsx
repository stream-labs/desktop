import React from 'react';
import omit from 'lodash/omit';
import { useModule } from '../../hooks/useModule';
import { mutation } from '../../store';
import { Services } from '../../service-provider';
import { TPropertiesManager, TSourceType } from 'services/sources';
import { WidgetType } from 'services/widgets';
import { byOS, OS } from 'util/operating-systems';
import { IAppSource } from 'services/platform-apps';

interface ISelectSourceOptions {
  propertiesManager?: TPropertiesManager;
  widgetType?: WidgetType;
  appId?: string;
  appSourceId?: string;
}

type TInspectableSource = TSourceType | WidgetType | 'streamlabel' | 'app_source' | string;

/**
 * A module for components in the SourceShowcase window
 */
class SourceShowcaseModule {
  state = {
    inspectedSource: '' as TInspectableSource,
    inspectedAppId: '',
    inspectedAppSourceId: '',
  };

  private get sourcesService() {
    return Services.SourcesService;
  }

  private get platformAppsService() {
    return Services.PlatformAppsService;
  }

  get availableAppSources() {
    return this.platformAppsService.views.enabledApps.reduce<
      { source: IAppSource; appId: string }[]
    >((sources, app) => {
      if (app.manifest.sources) {
        app.manifest.sources.forEach(source => {
          sources.push({ source, appId: app.id });
        });
      }

      return sources;
    }, []);
  }

  @mutation()
  inspectSource(source: string, appId?: string, appSourceId?: string) {
    this.state.inspectedSource = source;
    if (appId) this.state.inspectedAppId = appId;
    if (appSourceId) this.state.inspectedAppSourceId = appSourceId;
  }

  selectInspectedSource() {
    const inspectedSource = this.state.inspectedSource;
    if (WidgetType[inspectedSource] != null) {
      this.selectWidget(WidgetType[inspectedSource] as WidgetType);
    } else if (inspectedSource === 'streamlabel') {
      this.selectStreamlabel();
    } else if (inspectedSource === 'replay') {
      this.selectSource('ffmpeg_source', { propertiesManager: 'replay' });
    } else if (inspectedSource === 'icon_library') {
      this.selectSource('image_source', { propertiesManager: 'iconLibrary' });
    } else if (inspectedSource === 'app_source') {
      this.selectAppSource(this.state.inspectedAppId, this.state.inspectedAppSourceId);
    } else if (
      this.sourcesService.getAvailableSourcesTypes().includes(inspectedSource as TSourceType)
    ) {
      this.selectSource(inspectedSource as TSourceType);
    }
  }

  selectSource(sourceType: TSourceType, options: ISelectSourceOptions = {}) {
    const managerType = options.propertiesManager || 'default';
    const propertiesManagerSettings: Dictionary<any> = { ...omit(options, 'propertiesManager') };

    this.sourcesService.showAddSource(sourceType, {
      propertiesManagerSettings,
      propertiesManager: managerType,
    });
  }

  selectStreamlabel() {
    this.selectSource(byOS({ [OS.Windows]: 'text_gdiplus', [OS.Mac]: 'text_ft2_source' }), {
      propertiesManager: 'streamlabels',
    });
  }

  selectWidget(type: WidgetType) {
    this.selectSource('browser_source', {
      propertiesManager: 'widget',
      widgetType: type,
    });
  }

  selectAppSource(appId: string, appSourceId: string) {
    // TODO: Could be other source type
    this.selectSource('browser_source', {
      appId,
      appSourceId,
      propertiesManager: 'platformApp',
    });
  }
}

// wrap the module in a hook
export function useSourceShowcaseSettings() {
  return useModule(SourceShowcaseModule).select();
}
