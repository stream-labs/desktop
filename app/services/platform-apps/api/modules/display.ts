import { apiMethod, EApiPermissions, IApiContext, Module } from './module';
import { Display } from 'services/video';
import uuid from 'uuid/v4';
import electron from 'electron';
import { Subscription } from 'rxjs';

interface IDisplayCreateOptions {
  position: IVec2;
  size: IVec2;
  sourceId?: string;
  paddingColor?: IRGBColor;
  paddingSize?: number;
}

interface IDisplayEntry {
  position: IVec2;
  size: IVec2;
  webviewVisible: boolean;
  webviewPosition: IVec2;
  webviewSubscription?: Subscription;
  display: Display;
}

export class DisplayModule extends Module {
  readonly moduleName = 'Display';
  readonly permissions: EApiPermissions[] = [];

  private displays: Dictionary<IDisplayEntry> = {};

  @apiMethod()
  create(ctx: IApiContext, options: IDisplayCreateOptions) {
    // const displayId = uuid();

    // const display = new Display(displayId, {
    //   electronWindowId: ctx.electronWindowId,
    //   slobsWindowId: ctx.slobsWindowId,
    //   paddingColor: options.paddingColor,
    //   paddingSize: options.paddingSize || 0,
    // });

    // display.resize(options.size.x, options.size.y);

    // this.displays[displayId] = {
    //   display,
    //   position: options.position,
    //   size: options.size,
    //   webviewVisible: true,
    //   webviewPosition: { x: 0, y: 0 },
    // };

    // this.displays[displayId].webviewSubscription = ctx.webviewTransform.subscribe(transform => {
    //   const displayEntry = this.displays[displayId];
    //   displayEntry.webviewVisible = transform.visible;
    //   displayEntry.webviewPosition = transform.pos;

    //   this.updateDisplay(displayEntry);
    // });

    // electron.remote.webContents.fromId(ctx.webContentsId).on('destroyed', () => {
    //   this.destroyDisplay(displayId);
    // });

    // return displayId;
  }

  @apiMethod()
  resize(ctx: IApiContext, displayId: string, size: IVec2) {
    const entry = this.getDisplayEntry(displayId);

    entry.size = size;
    this.updateDisplay(entry);
  }

  @apiMethod()
  move(ctx: IApiContext, displayId: string, position: IVec2) {
    const entry = this.getDisplayEntry(displayId);

    entry.position = position;
    this.updateDisplay(entry);
  }

  @apiMethod()
  destroy(ctx: IApiContext, displayId: string) {
    this.destroyDisplay(displayId);
  }

  private updateDisplay(displayEntry: IDisplayEntry) {
    if (displayEntry.webviewVisible) {
      displayEntry.display.resize(displayEntry.size.x, displayEntry.size.y);
      displayEntry.display.move(
        displayEntry.webviewPosition.x + displayEntry.position.x,
        displayEntry.webviewPosition.y + displayEntry.position.y,
      );
    } else {
      displayEntry.display.resize(0, 0);
    }
  }

  private destroyDisplay(displayId: string) {
    const displayEntry = this.getDisplayEntry(displayId);

    displayEntry.webviewSubscription.unsubscribe();
    displayEntry.display.destroy();
    delete this.displays[displayId];
  }

  private getDisplayEntry(displayId: string) {
    if (!this.displays[displayId]) {
      throw new Error(`The display ${displayId} does not exist!`);
    }

    return this.displays[displayId];
  }
}
