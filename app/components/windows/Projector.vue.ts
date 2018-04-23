import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import ModalLayout from 'components/ModalLayout.vue';
import SourcePreview from 'components/shared/SourcePreview.vue';
import Display from 'components/Display.vue';
import { Inject } from 'util/injector';
import { WindowsService } from 'services/windows';
import { ISourcesServiceApi } from 'services/sources';
import electron from 'electron';
import Util from 'services/utils';

@Component({
  components: {
    ModalLayout,
    SourcePreview,
    Display
  }
})
export default class Projector extends Vue {
  @Inject() windowsService: WindowsService;
  @Inject() sourcesService: ISourcesServiceApi;

  fullscreen = false;
  oldBounds: electron.Rectangle;

  get sourceId() {
    const windowId = Util.getCurrentUrlParams().windowId;
    return this.windowsService.getWindowOptions(windowId).sourceId;
  }

  get allDisplays() {
    return electron.remote.screen.getAllDisplays();
  }

  enterFullscreen(display: electron.Display) {
    this.fullscreen = true;
    const currentWindow = electron.remote.getCurrentWindow();
    this.oldBounds = currentWindow.getBounds();
    currentWindow.setPosition(
      display.bounds.x,
      display.bounds.y
    );
    currentWindow.setFullScreen(true);
    document.addEventListener('keydown', this.exitFullscreen);
  }

  exitFullscreen(e: KeyboardEvent) {
    if (e.code !== 'Escape') return;
    document.removeEventListener('keydown', this.exitFullscreen);
    this.fullscreen = false;
    const currentWindow = electron.remote.getCurrentWindow();
    currentWindow.setFullScreen(false);
    currentWindow.setBounds(this.oldBounds);
  }

  get title() {
    if (this.sourceId) {
      const name = this.sourcesService.getSource(this.sourceId).name;
      return `Projector: ${name}`;
    }
    return 'Projector: Output';
  }

}
