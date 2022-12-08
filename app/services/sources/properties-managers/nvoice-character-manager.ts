import { NVoiceCharacterService } from "app-services";
import { Inject } from "vue-property-decorator";
import { PropertiesManager } from "./properties-manager";

export interface INVoiceCharacterSettings {

}

export class NVoiceCharacterManager extends PropertiesManager {
  @Inject() nVoiceCharacterService: NVoiceCharacterService;
  blacklist = ['url', 'is_local_file', 'fps_custom', 'reroute_audio', 'fps', 'css', 'shutdown', 'restart_when_active', 'refreshnocache'];
  // displayOrder = [];

  settings: INVoiceCharacterSettings;

  applySettings(settings: Dictionary<any>) {
    // this.settings.widgetType = parseInt(settings.widgetType, 10);
    // this.setWidgetType(this.settings.widgetType);
  }

  /*
  setNVoiceCharacterType(type: WidgetType) {
    const url = this.nvoiceCharacterService.getUrl(type);

    if (this.obsSource.settings['url'] !== url) {
      this.obsSource.update({ url });
    }
  }
  */
}