import { StatefulService } from 'services';
import clamp from 'lodash/clamp';
import { DragHandler } from 'util/DragHandler';
import { Inject } from 'services/core/injector';
import { Scene, SceneItem, ScenesService, TSceneNode } from 'services/scenes';
import { VideoService } from 'services/video';
import { EditMenu } from 'util/menus/EditMenu';
import { AnchorPoint, AnchorPositions, ScalableRectangle } from 'util/ScalableRectangle';
import { WindowsService } from 'services/windows';
import { SelectionService, Selection } from 'services/selection';
import { TransitionsService } from 'services/transitions';
import { CustomizationService } from 'services/customization';
import { v2 } from '../util/vec2';
import { EditorCommandsService } from 'services/editor-commands';
import { mutation } from './core';
import { byOS, OS } from 'util/operating-systems';
import { TcpServerService } from './api/tcp-server';
import { Subject } from 'rxjs';

interface IResizeRegion {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  cursor: string;
  item: SceneItem;
}

interface IResizeOptions {
  lockRatio: boolean; // preserve the aspect ratio (default: true)
  lockX: boolean; // prevent changes to the X scale (default: false)
  lockY: boolean; // lockY: prevent changes to the Y scale (default: false)
  anchor: AnchorPoint; // anchor: an AnchorPoint enum to resize around
}

interface IEditorServiceState {
  cursor: string;
  changingPositionInProgress: boolean;
}

export interface IMouseEvent {
  offsetX: number;
  offsetY: number;
  pageX: number;
  pageY: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  button: number;
  buttons: number;
}

export class EditorService extends StatefulService<IEditorServiceState> {
  @Inject() private scenesService: ScenesService;
  @Inject() private windowsService: WindowsService;
  @Inject() private videoService: VideoService;
  @Inject() private selectionService: SelectionService;
  @Inject() private transitionsService: TransitionsService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private editorCommandsService: EditorCommandsService;
  @Inject() private tcpServerService: TcpServerService;

  /**
   * emit this event when drag or resize have been finished
   */
  positionUpdateFinished = new Subject<void>();

  static initialState: IEditorServiceState = {
    cursor: 'default',
    changingPositionInProgress: false,
  };

  renderedWidth = 0;
  renderedHeight = 0;
  renderedOffsetX = 0;
  renderedOffsetY = 0;

  dragHandler: DragHandler;
  resizeRegion: IResizeRegion;
  currentX: number;
  currentY: number;
  isCropping: boolean;
  canDrag = true;

  handleOutputResize(region: IRectangle) {
    this.renderedWidth = region.width;
    this.renderedHeight = region.height;
    this.renderedOffsetX = region.x;
    this.renderedOffsetY = region.y;
  }

  /*****************
   * Mouse Handling *
   *****************/

  handleMouseDown(event: IMouseEvent) {
    if (this.activeSources.length > 0) {
      const overResize = this.isOverResize(event);

      if (overResize) {
        this.startResizing(event, overResize);
        return;
      }
    }

    // prevent dragging if the clicking is past the source
    if (!this.getOverSources(event).length) this.canDrag = false;

    this.updateCursor(event);
  }

  handleMouseDblClick(event: IMouseEvent) {
    const overSources = this.getOverSources(event);

    if (!overSources.length) return;

    const parent = overSources[0].getParent();

    if (
      this.customizationService.state.folderSelection &&
      (!parent || (parent && parent.isSelected()))
    ) {
      this.selectionService.views.globalSelection.select(overSources[0].id);
    } else if (parent) {
      this.selectionService.views.globalSelection.select(parent.id);
    }
  }

  startDragging(event: IMouseEvent) {
    this.dragHandler = new DragHandler(event, {
      displaySize: {
        x: this.renderedWidth,
        y: this.renderedHeight,
      },
      displayOffset: {
        x: this.renderedOffsetX,
        y: this.renderedOffsetY,
      },
    });
    this.SET_CHANGING_POSITION_IN_PROGRESS(true);
    this.tcpServerService.stopRequestsHandling(false);
  }

  startResizing(event: IMouseEvent, region: IResizeRegion) {
    this.resizeRegion = region;
    this.currentX = event.pageX;
    this.currentY = event.pageY;

    if (event.altKey) this.isCropping = true;
    this.SET_CHANGING_POSITION_IN_PROGRESS(true);
    this.tcpServerService.stopRequestsHandling(false);
  }

  handleMouseUp(event: IMouseEvent) {
    this.canDrag = true;

    // If neither a drag or resize was initiated, it must have been
    // an attempted selection or right click.
    if (!this.dragHandler && !this.resizeRegion) {
      const overSources = this.getOverSources(event);

      // Find out if we are over any currently selected sources
      const overSelected = this.selectionService.views.globalSelection
        .getItems()
        .find(item => overSources.some(source => source.id === item.id));

      if (event.button === 0) {
        if (overSources.length) {
          let overNode: TSceneNode = overSources[0];
          if (this.customizationService.state.folderSelection) {
            overNode = overSources[0].hasParent() ? overSources[0].getParent() : overSources[0];
          }

          // Ctrl/Cmd adds or removes from a multiselection
          if (byOS({ [OS.Windows]: event.ctrlKey, [OS.Mac]: event.metaKey })) {
            if (overNode.isSelected()) {
              overNode.deselect();
            } else {
              overNode.addToSelection();
            }
          } else {
            if (overSelected && overSources.length > 1) {
              const currentIndex = overSources.findIndex(source => source.id === overSelected.id);

              overSources[(currentIndex + 1) % overSources.length].select();
            } else {
              overNode.select();
            }
          }
        } else {
          // Click was not over any sources so empty the selection
          this.selectionService.views.globalSelection.reset();
        }
      } else if (event.button === 2) {
        let menu: EditMenu;

        if (overSelected) {
          menu = new EditMenu({
            selectedSceneId: this.scene.id,
            showSceneItemMenu: true,
            selectedSourceId: overSelected.sourceId,
          });
        } else if (overSources.length) {
          this.selectionService.views.globalSelection.select(overSources[0].sceneItemId);
          menu = new EditMenu({
            selectedSceneId: this.scene.id,
            showSceneItemMenu: true,
            selectedSourceId: overSources[0].sourceId,
          });
        } else {
          menu = new EditMenu({ selectedSceneId: this.scene.id });
        }

        menu.popup();
      }
    }

    this.dragHandler = null;
    this.resizeRegion = null;
    this.isCropping = false;
    this.SET_CHANGING_POSITION_IN_PROGRESS(false);
    this.positionUpdateFinished.next();
    this.tcpServerService.startRequestsHandling();

    this.updateCursor(event);
  }

  handleMouseEnter(event: IMouseEvent) {
    if (event.buttons !== 1) {
      this.dragHandler = null;
      this.resizeRegion = null;
    }
  }

  handleMouseMove(event: IMouseEvent) {
    // We don't need to adjust mac coordinates for scale factor
    const factor = byOS({ [OS.Windows]: this.windowsService.state.main.scaleFactor, [OS.Mac]: 1 });
    const mousePosX = event.offsetX * factor - this.renderedOffsetX;
    const mousePosY = event.offsetY * factor - this.renderedOffsetY;

    const converted = this.convertScalarToBaseSpace(mousePosX, mousePosY);

    if (this.resizeRegion) {
      const name = this.resizeRegion.name;

      // We choose an anchor point opposite the resize region
      const optionsMap = {
        nw: { anchor: AnchorPoint.SouthEast },
        sw: { anchor: AnchorPoint.NorthEast },
        ne: { anchor: AnchorPoint.SouthWest },
        se: { anchor: AnchorPoint.NorthWest },
        n: { anchor: AnchorPoint.South, lockX: true },
        s: { anchor: AnchorPoint.North, lockX: true },
        e: { anchor: AnchorPoint.West, lockY: true },
        w: { anchor: AnchorPoint.East, lockY: true },
      };

      const options = {
        ...optionsMap[name],
        lockRatio: !event.shiftKey,
      };

      if (this.isCropping) {
        this.crop(converted.x, converted.y, options);
      } else {
        this.resize(converted.x, converted.y, options);
      }
    } else if (this.dragHandler) {
      this.dragHandler.move(event);
    } else if (event.buttons === 1) {
      // We might need to start dragging
      const sourcesInPriorityOrder = this.activeSources
        .concat(this.sceneItems)
        .filter(item => item);

      const overSource = sourcesInPriorityOrder.find(source => {
        return this.isOverSource(event, source);
      });

      if (overSource && this.canDrag) {
        const overNode =
          !overSource.isSelected() && overSource.hasParent() ? overSource.getParent() : overSource;

        // Make this source active
        if (event.ctrlKey || overNode.isSelected()) {
          overNode.addToSelection();
        } else {
          overNode.select();
        }

        // Start dragging it
        this.startDragging(event);
      }
    }

    this.updateCursor(event);
  }

  crop(x: number, y: number, options: IResizeOptions) {
    const source = this.resizeRegion.item;
    const rect = new ScalableRectangle(source.rectangle);

    rect.normalized(() => {
      rect.withAnchor(options.anchor, () => {
        // There's probably a more generic way to do this math
        switch (options.anchor) {
          case AnchorPoint.East: {
            const croppableWidth = rect.width - rect.crop.right - 2;
            const distance = croppableWidth * rect.scaleX - (rect.x - x);
            rect.crop.left = Math.round(clamp(distance / rect.scaleX, 0, croppableWidth));
            break;
          }

          case AnchorPoint.West: {
            const croppableWidth = rect.width - rect.crop.left - 2;
            const distance = croppableWidth * rect.scaleX + (rect.x - x);
            rect.crop.right = Math.round(clamp(distance / rect.scaleX, 0, croppableWidth));
            break;
          }

          case AnchorPoint.South: {
            const croppableHeight = rect.height - rect.crop.bottom - 2;
            const distance = croppableHeight * rect.scaleY - (rect.y - y);
            rect.crop.top = Math.round(clamp(distance / rect.scaleY, 0, croppableHeight));
            break;
          }

          case AnchorPoint.North: {
            const croppableHeight = rect.height - rect.crop.top - 2;
            const distance = croppableHeight * rect.scaleY + (rect.y - y);
            rect.crop.bottom = Math.round(clamp(distance / rect.scaleY, 0, croppableHeight));
            break;
          }
        }
      });
    });

    this.editorCommandsService.executeCommand(
      'CropItemsCommand',
      new Selection(this.scene.id, source.sceneItemId),
      rect.crop,
      { x: rect.x, y: rect.y },
    );
  }

  resize(
    // x & y are mouse positions in video space
    x: number,
    y: number,
    options: IResizeOptions,
  ) {
    // Set defaults
    const opts = {
      lockRatio: true,
      lockX: false,
      lockY: false,
      ...options,
    };

    let scaleXDelta = 1;
    let scaleYDelta = 1;
    const rect = this.selectionService.views.globalSelection.getBoundingRect();
    const anchorPosition = rect.getOffsetFromOrigin(AnchorPositions[opts.anchor]);

    // resizeRegion is opposite the anchor point
    const oppositePointsMap = { 0: 1, 0.5: 0.5, 1: 0 };
    const resizeRegionPosition = v2(
      oppositePointsMap[AnchorPositions[opts.anchor].x],
      oppositePointsMap[AnchorPositions[opts.anchor].y],
    );

    // represents the direction of resizing
    const scaleVector = resizeRegionPosition.sub(v2(AnchorPositions[opts.anchor]));

    if (scaleVector.x && !opts.lockX) {
      const newWidth = Math.abs(x - anchorPosition.x);
      scaleXDelta = newWidth / rect.width;
    }

    if (scaleVector.y && !opts.lockY) {
      const newHeight = Math.abs(y - anchorPosition.y);
      scaleYDelta = newHeight / rect.height;
    }

    // preserve aspect ratio
    if (opts.lockRatio) {
      // if AnchorPoint is corner point
      if (
        [
          AnchorPoint.SouthEast,
          AnchorPoint.SouthWest,
          AnchorPoint.NorthEast,
          AnchorPoint.NorthWest,
        ].includes(opts.anchor)
      ) {
        scaleYDelta = scaleXDelta = Math.max(scaleXDelta, scaleYDelta);
      } else if (scaleVector.x) {
        // if changing width
        scaleYDelta = scaleXDelta;
      } else {
        // if changing height
        scaleXDelta = scaleYDelta;
      }
    }

    this.editorCommandsService.executeCommand(
      'ResizeItemsCommand',
      this.selectionService.views.globalSelection,
      { x: scaleXDelta, y: scaleYDelta },
      AnchorPositions[opts.anchor],
    );
  }

  updateCursor(event: IMouseEvent) {
    if (this.dragHandler) {
      this.setCursor('-webkit-grabbing');
    } else if (this.resizeRegion) {
      this.setCursor(this.resizeRegion.cursor);
    } else {
      const overResize = this.isOverResize(event);

      if (overResize) {
        this.setCursor(overResize.cursor);
      } else {
        const overSource = this.getOverSources(event)[0];

        if (overSource) {
          this.setCursor('-webkit-grab');
        } else {
          this.setCursor('default');
        }
      }
    }
  }

  /**
   * Prevents running unnecessary mutations that get synced to every
   * window by only running a mutation if it would change the cursor.
   * @param cursor The cursor value to set
   */
  private setCursor(cursor: string) {
    if (this.state.cursor !== cursor) this.SET_CURSOR(cursor);
  }

  // Takes the given mouse event, and determines if it is
  // over the given box in base resolution space.
  isOverBox(event: IMouseEvent, x: number, y: number, width: number, height: number) {
    // We don't need to adjust mac coordinates for scale factor
    const factor = byOS({ [OS.Windows]: this.windowsService.state.main.scaleFactor, [OS.Mac]: 1 });

    const mouse = this.convertVectorToBaseSpace(event.offsetX * factor, event.offsetY * factor);

    const box = { x, y, width, height };

    if (mouse.x < box.x) {
      return false;
    }

    if (mouse.y < box.y) {
      return false;
    }

    if (mouse.x > box.x + box.width) {
      return false;
    }

    if (mouse.y > box.y + box.height) {
      return false;
    }

    return true;
  }

  /**
   * Determines if the given mouse event is over the
   * given source
   */
  isOverSource(event: IMouseEvent, source: SceneItem) {
    const rect = new ScalableRectangle(source.rectangle);
    rect.normalize();

    return this.isOverBox(event, rect.x, rect.y, rect.scaledWidth, rect.scaledHeight);
  }

  /**
   * returns the sources under the cursor
   */
  private getOverSources(event: IMouseEvent): SceneItem[] {
    return this.sceneItems.filter(source => {
      return this.isOverSource(event, source);
    });
  }

  // Determines if the given mouse event is over any
  // of the active source's resize regions.
  isOverResize(event: IMouseEvent) {
    if (this.activeSources.length > 0) {
      return this.resizeRegions.find(region => {
        return this.isOverBox(event, region.x, region.y, region.width, region.height);
      });
    }

    return null;
  }

  // Size (width & height) is a scalar value, and
  // only needs to be scaled when converting between
  // spaces.
  convertScalarToBaseSpace(x: number, y: number) {
    return {
      x: (x * this.baseWidth) / this.renderedWidth,
      y: (y * this.baseHeight) / this.renderedHeight,
    };
  }

  // Position is a vector value. When converting between
  // spaces, we have to add positional offsets.
  convertVectorToBaseSpace(x: number, y: number) {
    const movedX = x - this.renderedOffsetX;
    const movedY = y - this.renderedOffsetY;

    return this.convertScalarToBaseSpace(movedX, movedY);
  }

  // getters

  get activeSources(): SceneItem[] {
    return this.selectionService.views.globalSelection.getItems().filter(item => {
      return item.isVisualSource;
    });
  }

  get sceneItems(): SceneItem[] {
    const scene = this.scenesService.views.activeScene;
    if (scene) {
      return scene.getItems().filter(source => {
        return source.isVisualSource;
      });
    }

    return [];
  }

  get scene(): Scene {
    return this.scenesService.views.activeScene;
  }

  get baseWidth() {
    return this.videoService.baseWidth;
  }

  get baseHeight() {
    return this.videoService.baseHeight;
  }

  // Using a computed property since it is cached
  get resizeRegions(): IResizeRegion[] {
    let regions: IResizeRegion[] = [];

    this.selectionService.views.globalSelection.getItems().forEach(item => {
      regions = regions.concat(this.generateResizeRegionsForItem(item));
    });

    return regions;
  }

  generateResizeRegionsForItem(item: SceneItem): IResizeRegion[] {
    const renderedRegionRadius = 5;
    // We don't need to adjust mac coordinates for scale factor
    const factor = byOS({ [OS.Windows]: this.windowsService.state.main.scaleFactor, [OS.Mac]: 1 });
    const regionRadius = (renderedRegionRadius * factor * this.baseWidth) / this.renderedWidth;
    const width = regionRadius * 2;
    const height = regionRadius * 2;

    const rect = new ScalableRectangle(item.rectangle);
    rect.normalize();

    return [
      {
        item,
        width,
        height,
        name: 'nw',
        x: rect.x - regionRadius,
        y: rect.y - regionRadius,
        cursor: 'nwse-resize',
      },
      {
        item,
        width,
        height,
        name: 'n',
        x: rect.x + rect.scaledWidth / 2 - regionRadius,
        y: rect.y - regionRadius,
        cursor: 'ns-resize',
      },
      {
        item,
        width,
        height,
        name: 'ne',
        x: rect.x + rect.scaledWidth - regionRadius,
        y: rect.y - regionRadius,
        cursor: 'nesw-resize',
      },
      {
        item,
        width,
        height,
        name: 'e',
        x: rect.x + rect.scaledWidth - regionRadius,
        y: rect.y + rect.scaledHeight / 2 - regionRadius,
        cursor: 'ew-resize',
      },
      {
        item,
        width,
        height,
        name: 'se',
        x: rect.x + rect.scaledWidth - regionRadius,
        y: rect.y + rect.scaledHeight - regionRadius,
        cursor: 'nwse-resize',
      },
      {
        item,
        width,
        height,
        name: 's',
        x: rect.x + rect.scaledWidth / 2 - regionRadius,
        y: rect.y + rect.scaledHeight - regionRadius,
        cursor: 'ns-resize',
      },
      {
        item,
        width,
        height,
        name: 'sw',
        x: rect.x - regionRadius,
        y: rect.y + rect.scaledHeight - regionRadius,
        cursor: 'nesw-resize',
      },
      {
        item,
        width,
        height,
        name: 'w',
        x: rect.x - regionRadius,
        y: rect.y + rect.scaledHeight / 2 - regionRadius,
        cursor: 'ew-resize',
      },
    ];
  }

  @mutation()
  SET_CURSOR(cursor: string) {
    this.state.cursor = cursor;
  }

  @mutation()
  SET_CHANGING_POSITION_IN_PROGRESS(enabled: boolean) {
    this.state.changingPositionInProgress = enabled;
  }
}
