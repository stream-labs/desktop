import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import _ from 'lodash';
import { DragHandler } from 'util/DragHandler';
import { Inject } from 'util/injector';
import { Scene, SceneItem, ScenesService, TSceneNode } from 'services/scenes';
import { VideoService } from 'services/video';
import { EditMenu } from 'util/menus/EditMenu';
import { AnchorPoint, AnchorPositions, ScalableRectangle } from 'util/ScalableRectangle';
import { WindowsService } from 'services/windows';
import { SelectionService } from 'services/selection/selection';
import Display from 'components/shared/Display.vue';
import { TransitionsService } from 'services/transitions';
import { CustomizationService } from 'services/customization';
import { v2 } from '../util/vec2';

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

@Component({
  components: { Display },
})
export default class StudioEditor extends Vue {
  @Inject() private scenesService: ScenesService;
  @Inject() private windowsService: WindowsService;
  @Inject() private videoService: VideoService;
  @Inject() private selectionService: SelectionService;
  @Inject() private transitionsService: TransitionsService;
  @Inject() private customizationService: CustomizationService;

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

  $refs: {
    display: HTMLDivElement;
  };

  onOutputResize(region: IRectangle) {
    this.renderedWidth = region.width;
    this.renderedHeight = region.height;
    this.renderedOffsetX = region.x;
    this.renderedOffsetY = region.y;
  }

  get studioMode() {
    return this.transitionsService.state.studioMode;
  }

  // Not reactive, don't cache
  getStudioTransitionName() {
    return this.transitionsService.studioTransitionName;
  }

  /*****************
   * Mouse Handling *
   *****************/

  handleMouseDown(event: MouseEvent) {
    if (this.activeSources.length > 0) {
      const overResize = this.isOverResize(event);

      if (overResize) {
        this.startResizing(event, overResize);
        return;
      }
    }

    // prevent dragging if the clicking is past the source
    if (!this.getOverSource(event)) this.canDrag = false;

    this.updateCursor(event);
  }

  handleMouseDblClick(event: MouseEvent) {
    const overSource = this.getOverSource(event);

    if (!overSource) return;

    const parent = overSource.getParent();

    if (
      this.customizationService.getSettings().folderSelection &&
      (!parent || (parent && parent.isSelected()))
    ) {
      this.selectionService.select(overSource.id);
    } else if (parent) {
      this.selectionService.select(parent.id);
    }
  }

  startDragging(event: MouseEvent) {
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
  }

  startResizing(event: MouseEvent, region: IResizeRegion) {
    this.resizeRegion = region;
    this.currentX = event.pageX;
    this.currentY = event.pageY;

    if (event.altKey) this.isCropping = true;
  }

  handleMouseUp(event: MouseEvent) {
    this.canDrag = true;

    // If neither a drag or resize was initiated, it must have been
    // an attempted selection or right click.
    if (!this.dragHandler && !this.resizeRegion) {
      const overSource = this.getOverSource(event);

      // Either select a new source, or deselect all sources
      if (overSource) {
        let overNode: TSceneNode = overSource;
        if (this.customizationService.getSettings().folderSelection) {
          overNode = overSource.hasParent() ? overSource.getParent() : overSource;
        }

        if (event.ctrlKey) {
          if (overNode.isSelected()) {
            overNode.deselect();
          } else {
            overNode.addToSelection();
          }
        } else if (event.button === 0) {
          overNode.select();
        }
      } else if (event.button === 0) {
        this.selectionService.reset();
      }

      if (event.button === 2) {
        let menu: EditMenu;
        if (overSource) {
          this.selectionService.add(overSource.sceneItemId);
          menu = new EditMenu({
            selectedSceneId: this.scene.id,
            showSceneItemMenu: true,
            selectedSourceId: overSource.sourceId,
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

    this.updateCursor(event);
  }

  handleMouseEnter(event: MouseEvent) {
    if (event.buttons !== 1) {
      this.dragHandler = null;
      this.resizeRegion = null;
    }
  }

  handleMouseMove(event: MouseEvent) {
    const mousePosX = event.offsetX - this.renderedOffsetX;
    const mousePosY = event.offsetY - this.renderedOffsetY;

    const factor = this.windowsService.state.main.scaleFactor;
    const converted = this.convertScalarToBaseSpace(mousePosX * factor, mousePosY * factor);

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
      const sourcesInPriorityOrder = _.compact(this.activeSources.concat(this.sceneItems));

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
    const rect = new ScalableRectangle(source.getRectangle());

    rect.normalized(() => {
      rect.withAnchor(options.anchor, () => {
        // There's probably a more generic way to do this math
        switch (options.anchor) {
          case AnchorPoint.East: {
            const croppableWidth = rect.width - rect.crop.right - 2;
            const distance = croppableWidth * rect.scaleX - (rect.x - x);
            rect.crop.left = Math.round(_.clamp(distance / rect.scaleX, 0, croppableWidth));
            break;
          }

          case AnchorPoint.West: {
            const croppableWidth = rect.width - rect.crop.left - 2;
            const distance = croppableWidth * rect.scaleX + (rect.x - x);
            rect.crop.right = Math.round(_.clamp(distance / rect.scaleX, 0, croppableWidth));
            break;
          }

          case AnchorPoint.South: {
            const croppableHeight = rect.height - rect.crop.bottom - 2;
            const distance = croppableHeight * rect.scaleY - (rect.y - y);
            rect.crop.top = Math.round(_.clamp(distance / rect.scaleY, 0, croppableHeight));
            break;
          }

          case AnchorPoint.North: {
            const croppableHeight = rect.height - rect.crop.top - 2;
            const distance = croppableHeight * rect.scaleY + (rect.y - y);
            rect.crop.bottom = Math.round(_.clamp(distance / rect.scaleY, 0, croppableHeight));
            break;
          }
        }
      });
    });

    this.scene.getItem(source.sceneItemId).setTransform({
      position: { x: rect.x, y: rect.y },
      crop: rect.crop,
    });
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
    const rect = this.selectionService.getBoundingRect();
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
    if (opts.lockRatio) scaleYDelta = scaleXDelta = Math.max(scaleXDelta, scaleYDelta);

    // scale all selected items
    this.selectionService.scaleWithOffset(
      { x: scaleXDelta, y: scaleYDelta },
      this.selectionService.getBoundingRect().getOffsetFromOrigin(AnchorPositions[opts.anchor]),
    );
  }

  updateCursor(event: MouseEvent) {
    if (this.dragHandler) {
      this.$refs.display.style.cursor = '-webkit-grabbing';
    } else if (this.resizeRegion) {
      this.$refs.display.style.cursor = this.resizeRegion.cursor;
    } else {
      const overResize = this.isOverResize(event);

      if (overResize) {
        this.$refs.display.style.cursor = overResize.cursor;
      } else {
        const overSource = this.getOverSource(event);

        if (overSource) {
          this.$refs.display.style.cursor = '-webkit-grab';
        } else {
          this.$refs.display.style.cursor = 'default';
        }
      }
    }
  }

  // Takes the given mouse event, and determines if it is
  // over the given box in base resolution space.
  isOverBox(event: MouseEvent, x: number, y: number, width: number, height: number) {
    const factor = this.windowsService.state.main.scaleFactor;

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
  isOverSource(event: MouseEvent, source: SceneItem) {
    const rect = new ScalableRectangle(source.getRectangle());
    rect.normalize();

    return this.isOverBox(event, rect.x, rect.y, rect.scaledWidth, rect.scaledHeight);
  }

  /**
   * returns the source under the cursor
   */
  private getOverSource(event: MouseEvent): SceneItem {
    return this.sceneItems.find(source => {
      return this.isOverSource(event, source);
    });
  }

  // Determines if the given mouse event is over any
  // of the active source's resize regions.
  isOverResize(event: MouseEvent) {
    if (this.activeSources.length > 0) {
      return _.find(this.resizeRegions, region => {
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
    return this.selectionService.getItems().filter(item => {
      return item.isVisualSource;
    });
  }

  get sceneItems(): SceneItem[] {
    const scene = this.scenesService.activeScene;
    if (scene) {
      return scene.getItems().filter(source => {
        return source.isVisualSource;
      });
    }

    return [];
  }

  get scene(): Scene {
    return this.scenesService.activeScene;
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

    this.selectionService.getItems().forEach(item => {
      regions = regions.concat(this.generateResizeRegionsForItem(item));
    });

    return regions;
  }

  generateResizeRegionsForItem(item: SceneItem): IResizeRegion[] {
    const renderedRegionRadius = 5;
    const factor = this.windowsService.state.main.scaleFactor;
    const regionRadius = (renderedRegionRadius * factor * this.baseWidth) / this.renderedWidth;
    const width = regionRadius * 2;
    const height = regionRadius * 2;

    const rect = new ScalableRectangle(item.getRectangle());
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
}
