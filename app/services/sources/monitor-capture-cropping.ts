import electron from 'electron';
import { Inject } from 'util/injector';
import { WindowsService } from 'services/windows';
import { ISourcesServiceApi } from 'services/sources';
import { StatefulService, mutation } from '../stateful-service';
import { ScalableRectangle, AnchorPoint } from 'util/ScalableRectangle';
import { SceneItem } from '../scenes';

interface IMonitorCaptureCroppingServiceState {
  sceneId: string | null;
  sceneItemId: string | null;
  sourceId: string | null;
  windowId: string | null;
}

interface Area {
  top: number;
  left: number
  width: number;
  height: number;
}

export class MonitorCaptureCroppingService extends StatefulService<IMonitorCaptureCroppingServiceState> {
  @Inject() windowsService: WindowsService;
  @Inject() sourcesService: ISourcesServiceApi;
  timer: number;

  static initialState = {
    sceneId: null,
    sceneItemId: null,
    sourceId: null,
    windowId: null,
  } as IMonitorCaptureCroppingServiceState;

  get isCropping(): boolean {
    return Boolean(this.state.sourceId);
  }

  async startCropping(sceneId: string, sceneItemId: string, sourceId: string) {
    if (this.isCropping) return;

    this.START_CROPPING(sceneId, sceneItemId, sourceId);

    const source = this.sourcesService.getSource(sourceId);
    const currentDisplayId = source.getSettings().monitor;
    const displays = electron.remote.screen.getAllDisplays();
    const display = displays[currentDisplayId];

    const windowId = this.windowsService.createOneOffWindow({
      componentName: 'CroppingOverlay',
      queryParams: { sourceId },
      size: display.bounds,
      transparent: true,
      resizable: false,
      alwaysOnTop: true,
    });
    this.SET_WINDOW_ID(windowId);

    const windowObj = this.windowsService.getWindow(windowId);
    windowObj.on('close', () => this.endCropping());

    this.callNext();
  }

  private endCropping() {
    if (!this.isCropping) return;

    clearTimeout(this.timer);
    this.END_CROPPING();
    this.CLEAR_WINDOW_ID();
  }

  crop(targetArea: Area) {
    const sceneItem = new SceneItem(this.state.sceneId, this.state.sceneItemId, this.state.sourceId);
    const rect = new ScalableRectangle(sceneItem.getRectangle());

    const screen = electron.remote.screen;
    const globalMousePoint = screen.getCursorScreenPoint();
    const nearestDisplay = screen.getDisplayNearestPoint(globalMousePoint);
    const { width: displayWidth, height: displayHeight } = nearestDisplay.bounds;

    const factor = this.windowsService.state.main.scaleFactor;

    rect.normalized(() => {
      rect.withAnchor(AnchorPoint.Center, () => {
        rect.crop.top = targetArea.top * factor;
        rect.crop.left = targetArea.left * factor;
        rect.crop.bottom = (displayHeight - (targetArea.top + targetArea.height)) * factor;
        rect.crop.right = (displayWidth - (targetArea.left + targetArea.width)) * factor;
      });
    });

    sceneItem.setTransform({
      position: { x: rect.x, y: rect.y },
      crop: rect.crop
    });
  }

  updateTargetWindow() {
    if (!this.isCropping) return;

    const screen = electron.remote.screen;
    const globalMousePoint = screen.getCursorScreenPoint();
    const nearestDisplay = screen.getDisplayNearestPoint(globalMousePoint);
    const windowObj = this.windowsService.getWindow(this.state.windowId);

    const { workArea } = nearestDisplay;
    windowObj.setSize(workArea.width, workArea.height);
    windowObj.setPosition(workArea.x, workArea.y);

    this.callNext();
  }

  callNext() {
    this.timer = window.setTimeout(() => this.updateTargetWindow(), 200);
  }

  @mutation()
  START_CROPPING(sceneId: string, sceneItemId: string, sourceId: string) {

    this.state.sceneId = sceneId;
    this.state.sceneItemId = sceneItemId;
    this.state.sourceId = sourceId;
  }

  @mutation()
  END_CROPPING() {
    this.state.sceneId = null;
    this.state.sceneItemId = null;
    this.state.sourceId = null;
  }

  @mutation()
  SET_WINDOW_ID(windowId: string) {
    this.state.windowId = windowId;
  }

  @mutation()
  CLEAR_WINDOW_ID() {
    this.state.windowId = null;
  }
}
