import { apiMethod, EApiPermissions, IApiContext, Module, IBrowserViewTransform } from './module';
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
  tranformSubscription?: Subscription;
  display: Display;
  displayId: string;
  options: IDisplayCreateOptions;
}

export class DisplayModule extends Module {
  readonly moduleName = 'Display';
  readonly permissions: EApiPermissions[] = [];

  private displays: Dictionary<IDisplayEntry> = {};

  @apiMethod()
  create(ctx: IApiContext, options: IDisplayCreateOptions) {
    const displayId = uuid();

    this.displays[displayId] = {
      displayId,
      options,
      display: null,
    };

    this.displays[displayId].tranformSubscription = ctx.pageTransform.subscribe(transform => {
      this.updateDisplay(this.displays[displayId], transform);
    });

    electron.remote.webContents.fromId(ctx.webContentsId).on('destroyed', () => {
      this.destroyDisplay(displayId);
    });

    return displayId;
  }

  @apiMethod()
  resize(ctx: IApiContext, displayId: string, size: IVec2) {
    const entry = this.getDisplayEntry(displayId);

    entry.options.size = size;
    this.updateDisplay(entry, ctx.pageTransform.getValue());
  }

  @apiMethod()
  move(ctx: IApiContext, displayId: string, position: IVec2) {
    const entry = this.getDisplayEntry(displayId);

    entry.options.position = position;
    this.updateDisplay(entry, ctx.pageTransform.getValue());
  }

  @apiMethod()
  destroy(ctx: IApiContext, displayId: string) {
    this.destroyDisplay(displayId);
  }

  private updateDisplay(displayEntry: IDisplayEntry, transform: IBrowserViewTransform) {
    // The container isn't mounted, so get rid of any active displays and stop
    if (!transform.mounted) {
      if (displayEntry.display) this.removeDisplay(displayEntry);
      return;
    }

    // The display is mounted to the wrong window, destroy it
    if (
      displayEntry.display &&
      displayEntry.display.electronWindowId !== transform.electronWindowId
    ) {
      this.removeDisplay(displayEntry);
    }

    // There is no active display, so create one
    if (!displayEntry.display) {
      // Create display
      displayEntry.display = new Display(displayEntry.displayId, {
        electronWindowId: transform.electronWindowId,
        slobsWindowId: transform.slobsWindowId,
        paddingColor: displayEntry.options.paddingColor,
        paddingSize: displayEntry.options.paddingSize || 0,
      });
    }

    // Move/Resize display
    displayEntry.display.resize(displayEntry.options.size.x, displayEntry.options.size.y);
    displayEntry.display.move(
      transform.pos.x + displayEntry.options.position.x,
      transform.pos.y + displayEntry.options.position.y,
    );
  }

  /**
   * Removes a display from an entry.  This should be used
   * when the display currently exists from the context of
   * the app, but the app is not currently being shown on
   * any screen, so we want to destroy the display.
   * @param entry The display entry
   */
  private removeDisplay(entry: IDisplayEntry) {
    entry.display.destroy();
    entry.display = null;
  }

  private destroyDisplay(displayId: string) {
    const displayEntry = this.getDisplayEntry(displayId);

    displayEntry.tranformSubscription.unsubscribe();

    if (displayEntry.display) {
      displayEntry.display.destroy();
    }

    delete this.displays[displayId];
  }

  private getDisplayEntry(displayId: string) {
    if (!this.displays[displayId]) {
      throw new Error(`The display ${displayId} does not exist!`);
    }

    return this.displays[displayId];
  }
}
