import { throttle } from 'lodash-decorators';
import { Service } from '../service';
import { Inject } from 'util/injector';
import { UserService } from '../user';
import { ScenesService, SceneItem, Scene } from '../scenes';
import { SourcesService } from '../sources';
import { VideoService } from '../video';
import { HostsService } from '../hosts';
import { ScalableRectangle, AnchorPoint } from 'util/ScalableRectangle';
import namingHelpers from 'util/NamingHelpers';
import fs from 'fs';
import { WidgetSettingsService } from './settings/widget-settings';
import { ServicesManager } from 'services-manager';
import { authorizedHeaders } from 'util/requests';
import { ISerializableWidget } from './widgets-api';
import { WidgetType, WidgetDefinitions, WidgetTesters } from './widgets-data';
import { ServiceHelper } from '../stateful-service';
import { WidgetSource } from './widget-source';

@ServiceHelper()
export class WidgetTester {
  constructor(public name: string, private url: string) {}

  @Inject() userService: UserService;

  @throttle(1000)
  test() {
    const headers = authorizedHeaders(this.userService.apiToken);
    fetch(new Request(this.url, { headers }));
  }
}

export class WidgetsService extends Service {
  @Inject() userService: UserService;
  @Inject() scenesService: ScenesService;
  @Inject() sourcesService: SourcesService;
  @Inject() hostsService: HostsService;
  @Inject() videoService: VideoService;

  createWidget(type: WidgetType, name?: string): SceneItem {
    if (!this.userService.isLoggedIn()) return;

    const scene = this.scenesService.activeScene;
    const widget = WidgetDefinitions[type];

    const suggestedName =
      name ||
      namingHelpers.suggestName(name || widget.name, (name: string) => {
        return this.sourcesService.getSourcesByName(name).length;
      });

    const source = this.sourcesService.createSource(
      suggestedName,
      'browser_source',
      {
        url: widget.url(
          this.hostsService.streamlabs,
          this.userService.widgetToken,
          this.userService.platform.type
        ),
        width: widget.width,
        height: widget.height
      },
      {
        propertiesManager: 'widget',
        propertiesManagerSettings: {
          widgetType: type
        }
      }
    );
    const sceneItem = scene.addSource(source.sourceId);

    // Give a couple seconds for the resize to propagate
    setTimeout(() => {
      const source = scene.getItem(sceneItem.sceneItemId);

      // Set the default transform
      const rect = new ScalableRectangle(source.getRectangle());

      rect.withAnchor(widget.anchor, () => {
        rect.x = widget.x * this.videoService.baseWidth;
        rect.y = widget.y * this.videoService.baseHeight;
      });

      source.setTransform({
        position: {
          x: rect.x,
          y: rect.y
        }
      });
    }, 1500);

    return sceneItem;
  }

  getWidget(sourceId: string): WidgetSource {
    return this.sourcesService.state.sources[sourceId] ? new WidgetSource(sourceId) : null;
  }

  getWidgetUrl(type: WidgetType) {
    if (!this.userService.isLoggedIn()) return;
    return WidgetDefinitions[type].url(
      this.hostsService.streamlabs,
      this.userService.widgetToken,
      this.userService.platform.type
    );
  }

  getWidgetComponent(type: WidgetType): string {
    return WidgetType[type];
  }

  getWidgetSettingsService(type: WidgetType): WidgetSettingsService<any> {
    const serviceName = this.getWidgetComponent(type) + 'Service';
    const servicesManager: ServicesManager = ServicesManager.instance;
    return servicesManager.getResource(serviceName);
  }

  getTesters() {
    if (!this.userService.isLoggedIn()) return;
    return WidgetTesters.filter(tester => {
      return tester.platforms.includes(this.userService.platform.type);
    }).map(tester => {
      return new WidgetTester(
        tester.name,
        tester.url(
          this.hostsService.streamlabs,
          this.userService.platform.type
        )
      );
    });
  }

  /**
   * Save a widget file to the given path
   * @param path the path to the save the widget file
   * @param widgetItemId the id of the widget to save
   */
  async saveWidgetFile(path: string, widgetItemId: string) {
    const widgetItem = this.scenesService.getSceneItem(widgetItemId);
    const data = this.exportWidgetJSON(widgetItem);
    const json = JSON.stringify(data, null, 2);

    await new Promise((resolve, reject) => {
      fs.writeFile(path, json, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Exports a serializable object representing the widget
   * which can be saved into a file and imported later.
   * @param widgetItem the SceneItem of the widget to export
   */
  private exportWidgetJSON(widgetItem: SceneItem): ISerializableWidget {
    const source = widgetItem.getSource();

    if (source.getPropertiesManagerType() !== 'widget') {
      throw new Error('Cannot export widget JSON for non-widget');
    }

    const settings = { ...source.getObsInput().settings };
    settings.url = '';

    return {
      name: source.name,
      type: source.getPropertiesManagerSettings().widgetType,
      settings,
      x: widgetItem.transform.position.x / this.videoService.baseWidth,
      y: widgetItem.transform.position.y / this.videoService.baseHeight,
      scaleX: widgetItem.transform.scale.x / this.videoService.baseWidth,
      scaleY: widgetItem.transform.scale.y / this.videoService.baseHeight
    };
  }

  /**
   * Load a widget file from the given path
   * @param path the path to the widget file to laod
   * @param sceneId the id of the scene to load into
   */
  async loadWidgetFile(path: string, sceneId: string) {
    const scene = this.scenesService.getScene(sceneId);
    const json = await new Promise<string>((resolve, reject) => {
      fs.readFile(path, (err, data) => {
        if (err) {
          reject();
        } else {
          resolve(data.toString());
        }
      });
    });

    const widget = JSON.parse(json);
    this.importWidgetJSON(widget, scene);
  }

  /**
   * Imports a serialized widget into a scene
   * @param widget the widget to import
   * @param scene the scene to import into
   */
  private importWidgetJSON(widget: ISerializableWidget, scene: Scene) {
    let widgetItem: SceneItem;

    // First, look for an existing widget of the same type
    widgetItem = scene.getItems().find(item => {
      const source = item.getSource();
      if (source.getPropertiesManagerType() !== 'widget') return false;
      if (source.getPropertiesManagerSettings().widgetType !== widget.type) {
        return false;
      }
      return true;
    });

    // Otherwise, create a new one
    if (!widgetItem) {
      widgetItem = scene.createAndAddSource(scene.name, 'browser_source');
    }

    const source = widgetItem.getSource();

    source.setName(widget.name);
    source.updateSettings(widget.settings);
    source.replacePropertiesManager('widget', { widgetType: widget.type });
    widgetItem.setTransform({
      position: {
        x: widget.x * this.videoService.baseWidth,
        y: widget.y * this.videoService.baseHeight
      },
      scale: {
        x: widget.scaleX * this.videoService.baseWidth,
        y: widget.scaleY * this.videoService.baseHeight
      }
    });
  }
}
