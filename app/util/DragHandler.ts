import { SettingsService } from 'services/settings';
import { Inject } from 'services/core/injector';
import { SceneItem } from 'services/scenes';
import { VideoService } from 'services/video';
import { WindowsService } from 'services/windows';
import { AnchorPoint, AnchorPositions } from 'util/ScalableRectangle';
import { SelectionService } from 'services/selection';
import { EditorCommandsService } from 'services/editor-commands';
import { IMouseEvent } from 'services/editor';
import { byOS, OS } from './operating-systems';
import { v2 } from './vec2';
import { Rect } from './rect';

/*
 * An edge looks like:
 * ________________________________
 * |                ^
 * |                |
 * |      offset -> |
 * |                |
 * |                v
 * |     depth      /\ ^
 * |<-------------->|| |
 * |                || |
 * |        edge -> || | <- length
 * |                || |
 * |                || |
 * |                \/ v
 *
 * An edge can be horizontal or vertical, but only alike
 * types make sense to compare to each other.
 */
interface IEdge {
  depth: number;
  offset: number;
  length: number;
}

// A set of edges separated by location
interface IEdgeCollection {
  top: IEdge[];
  bottom: IEdge[];
  left: IEdge[];
  right: IEdge[];
}

interface ISourceEdges {
  top: IEdge;
  bottom: IEdge;
  left: IEdge;
  right: IEdge;
}

interface IDragHandlerOptions {
  displaySize: IVec2;
  displayOffset: IVec2;
}

// Encapsulates logic for dragging sources in the overlay editor
export class DragHandler {
  @Inject() private settingsService: SettingsService;
  @Inject() private videoService: VideoService;
  @Inject() private windowsService: WindowsService;
  @Inject() private selectionService: SelectionService;
  @Inject() private editorCommandsService: EditorCommandsService;

  // Settings
  snapEnabled: boolean;
  renderedSnapDistance: number;
  screenSnapping: boolean;
  sourceSnapping: boolean;
  centerSnapping: boolean;

  // Video Canvas
  baseWidth: number;
  baseHeight: number;
  displaySize: IVec2;
  displayOffset: IVec2;
  scaleFactor: number;
  snapDistance: number;

  // Sources
  private draggedRect: Rect;
  private otherSources: SceneItem[];

  // Mouse properties
  mouseOffset: IVec2 = { x: 0, y: 0 };

  targetEdges: IEdgeCollection;

  /**
   * @param startEvent the mouse event for this drag
   * @param options drag handler options
   */
  constructor(startEvent: IMouseEvent, options: IDragHandlerOptions) {
    // Load some settings we care about
    this.snapEnabled = this.settingsService.views.values.General.SnappingEnabled;
    this.renderedSnapDistance = this.settingsService.views.values.General.SnapDistance;
    this.screenSnapping = this.settingsService.views.values.General.ScreenSnapping;
    this.sourceSnapping = this.settingsService.views.values.General.SourceSnapping;
    this.centerSnapping = this.settingsService.views.values.General.CenterSnapping;

    // Load some attributes about the video canvas
    this.baseWidth = this.videoService.baseWidth;
    this.baseHeight = this.videoService.baseHeight;
    this.displaySize = options.displaySize;
    this.displayOffset = options.displayOffset;

    // We don't need to adjust mac coordinates for scale factor
    this.scaleFactor = byOS({
      [OS.Windows]: this.windowsService.state.main.scaleFactor,
      [OS.Mac]: 1,
    });

    this.snapDistance =
      (this.renderedSnapDistance * this.scaleFactor * this.baseWidth) / this.displaySize.x;

    this.draggedRect = this.selectionService.views.globalSelection.getBoundingRect();

    this.otherSources = this.selectionService.views.globalSelection
      .clone()
      .invert()
      .getItems()
      .filter(item => item.isVisualSource);

    const pos = this.mousePositionInCanvasSpace(startEvent);

    this.mouseOffset.x = pos.x - this.draggedRect.x;
    this.mouseOffset.y = pos.y - this.draggedRect.y;

    // Generate the edges we should snap to
    this.targetEdges = this.generateTargetEdges();
  }

  resize(event: IMouseEvent, anchor: AnchorPoint) {
    let { x, y } = this.mousePositionInCanvasSpace(event);
    const rect = this.selectionService.views.globalSelection.getBoundingRect();
    const anchorPosition = rect.getOffsetFromOrigin(AnchorPositions[anchor]);
    const lockRatio = !event.shiftKey;

    // Adjust position for snapping
    // Holding Ctrl temporary disables snapping
    if (this.snapEnabled && !event.ctrlKey) {
      const sourceEdges = this.generateRectangleEdges(rect);

      // Only edges touching the resize region can snap
      const snappableEdges: { top: boolean; bottom: boolean; left: boolean; right: boolean } = {
        [AnchorPoint.East]: {
          top: false,
          bottom: false,
          left: true,
          right: false,
        },
        [AnchorPoint.North]: {
          top: false,
          bottom: true,
          left: false,
          right: false,
        },
        [AnchorPoint.South]: {
          top: true,
          bottom: false,
          left: false,
          right: false,
        },
        [AnchorPoint.West]: {
          top: false,
          bottom: false,
          left: false,
          right: true,
        },
        [AnchorPoint.NorthWest]: {
          top: true,
          bottom: false,
          left: true,
          right: false,
        },
        [AnchorPoint.NorthEast]: {
          top: true,
          bottom: false,
          left: false,
          right: true,
        },
        [AnchorPoint.SouthEast]: {
          top: false,
          bottom: true,
          left: false,
          right: true,
        },
        [AnchorPoint.SouthWest]: {
          top: false,
          bottom: true,
          left: true,
          right: false,
        },
      }[anchor];

      const leftDistance = snappableEdges.left
        ? this.getNearestEdgeDistance(sourceEdges.left, this.targetEdges.left)
        : Infinity;
      const rightDistance = snappableEdges.right
        ? this.getNearestEdgeDistance(sourceEdges.right, this.targetEdges.right)
        : Infinity;
      const topDistance = snappableEdges.top
        ? this.getNearestEdgeDistance(sourceEdges.top, this.targetEdges.top)
        : Infinity;
      const bottomDistance = snappableEdges.bottom
        ? this.getNearestEdgeDistance(sourceEdges.bottom, this.targetEdges.bottom)
        : Infinity;

      let snapDistanceX = 0;
      let snapDistanceY = 0;

      if (Math.abs(leftDistance) <= Math.abs(rightDistance)) {
        if (Math.abs(leftDistance) < this.snapDistance) snapDistanceX = leftDistance;
      } else {
        if (Math.abs(rightDistance) < this.snapDistance) snapDistanceX = rightDistance;
      }

      if (Math.abs(topDistance) <= Math.abs(bottomDistance)) {
        if (Math.abs(topDistance) < this.snapDistance) snapDistanceY = topDistance;
      } else {
        if (Math.abs(bottomDistance) < this.snapDistance) snapDistanceY = bottomDistance;
      }

      if (snapDistanceX) console.log('WOULD SNAP X', snapDistanceX);
      if (snapDistanceY) console.log('WOULD SNAP Y', snapDistanceY);

      x += snapDistanceX;
      y += snapDistanceY;
    }

    // resizeRegion is opposite the anchor point
    const oppositePointsMap = { 0: 1, 0.5: 0.5, 1: 0 };
    const resizeRegionPosition = v2(
      oppositePointsMap[AnchorPositions[anchor].x],
      oppositePointsMap[AnchorPositions[anchor].y],
    );

    // represents the direction of resizing
    const scaleVector = resizeRegionPosition.sub(v2(AnchorPositions[anchor]));
    const scaleDelta = v2(x, y)
      .sub(anchorPosition)
      .multiply(scaleVector)
      .divide(v2(rect.width, rect.height));

    if (lockRatio) {
      scaleDelta.x = scaleDelta.y = Math.max(scaleDelta.x, scaleDelta.y);
    } else {
      // Zero out scale deltas if we aren't scaling on that axis
      if (!scaleVector.x) scaleDelta.x = 1;
      if (!scaleVector.y) scaleDelta.y = 1;
    }

    this.editorCommandsService.executeCommand(
      'ResizeItemsCommand',
      this.selectionService.views.globalSelection,
      scaleDelta,
      AnchorPositions[anchor],
    );
  }

  // Should be called when the mouse moves
  move(event: IMouseEvent) {
    const rect = { ...this.draggedRect };
    const mousePos = this.mousePositionInCanvasSpace(event);

    // Move the rectangle to its new position
    rect.x = mousePos.x - this.mouseOffset.x;
    rect.y = mousePos.y - this.mouseOffset.y;

    // Adjust position for snapping
    // Holding Ctrl temporary disables snapping
    if (this.snapEnabled && !event.ctrlKey) {
      const sourceEdges = this.generateRectangleEdges(rect);

      const leftDistance = this.getNearestEdgeDistance(sourceEdges.left, this.targetEdges.left);
      const rightDistance = this.getNearestEdgeDistance(sourceEdges.right, this.targetEdges.right);
      const topDistance = this.getNearestEdgeDistance(sourceEdges.top, this.targetEdges.top);
      const bottomDistance = this.getNearestEdgeDistance(
        sourceEdges.bottom,
        this.targetEdges.bottom,
      );

      let snapDistanceX = 0;
      let snapDistanceY = 0;

      if (Math.abs(leftDistance) <= Math.abs(rightDistance)) {
        if (Math.abs(leftDistance) < this.snapDistance) snapDistanceX = leftDistance;
      } else {
        if (Math.abs(rightDistance) < this.snapDistance) snapDistanceX = rightDistance;
      }

      if (Math.abs(topDistance) <= Math.abs(bottomDistance)) {
        if (Math.abs(topDistance) < this.snapDistance) snapDistanceY = topDistance;
      } else {
        if (Math.abs(bottomDistance) < this.snapDistance) snapDistanceY = bottomDistance;
      }

      rect.x += snapDistanceX;
      rect.y += snapDistanceY;
    }

    // Translate new position into a delta that can be applied
    // to all selected sources equally.
    const deltaX = rect.x - this.draggedRect.x;
    const deltaY = rect.y - this.draggedRect.y;

    this.editorCommandsService.executeCommand(
      'MoveItemsCommand',
      this.selectionService.views.globalSelection,
      { x: deltaX, y: deltaY },
    );

    // Update the position of the bounding rect for the next set of calculations
    this.draggedRect.x = rect.x;
    this.draggedRect.y = rect.y;
  }

  private mousePositionInCanvasSpace(event: IMouseEvent): IVec2 {
    return this.pageSpaceToCanvasSpace({
      x: event.offsetX - this.displayOffset.x,
      y: event.offsetY - this.displayOffset.y,
    });
  }

  private pageSpaceToCanvasSpace(vec: IVec2) {
    return {
      x: (vec.x * this.scaleFactor * this.baseWidth) / this.displaySize.x,
      y: (vec.y * this.scaleFactor * this.baseHeight) / this.displaySize.y,
    };
  }

  /**
   * Returns true if 2 edges overlap
   * @param a an edge
   * @param b another edge
   */
  private edgesOverlap(a: IEdge, b: IEdge): boolean {
    if (a.offset + a.length < b.offset) {
      return false;
    }

    if (b.offset + b.length < a.offset) {
      return false;
    }

    return true;
  }

  private getNearestEdgeDistance(sourceEdge: IEdge, targetEdges: IEdge[]) {
    let minDistance = Infinity;

    targetEdges.forEach(targetEdge => {
      if (!this.edgesOverlap(targetEdge, sourceEdge)) return;

      const distance = targetEdge.depth - sourceEdge.depth;

      if (Math.abs(distance) < Math.abs(minDistance)) {
        minDistance = distance;
      }
    });

    return minDistance;
  }

  /**
   * Generates the target edges, which are edges that the
   * currently dragged source can snap to.  They are separated
   * by which edge of the source can snap to it.
   */
  private generateTargetEdges() {
    const targetEdges: IEdgeCollection = {
      left: [],
      top: [],
      right: [],
      bottom: [],
    };

    // Screen edge snapping:
    if (this.screenSnapping) {
      // Screen left
      targetEdges.left.push({
        depth: 0,
        offset: 0,
        length: this.baseHeight,
      });

      // Screen top
      targetEdges.top.push({
        depth: 0,
        offset: 0,
        length: this.baseWidth,
      });

      // Screen right
      targetEdges.right.push({
        depth: this.baseWidth,
        offset: 0,
        length: this.baseHeight,
      });

      // Screen bottom
      targetEdges.bottom.push({
        depth: this.baseHeight,
        offset: 0,
        length: this.baseWidth,
      });
    }

    // Source edge snapping:
    if (this.sourceSnapping) {
      this.otherSources.forEach(source => {
        const edges = this.generateRectangleEdges(source.getBoundingRect());

        // The dragged source snaps to the adjacent edge
        // of other sources.  So the right edge snaps to
        // the left edge of other sources, etc.
        targetEdges.left.push(edges.right);
        targetEdges.top.push(edges.bottom);
        targetEdges.right.push(edges.left);
        targetEdges.bottom.push(edges.top);
      });
    }

    return targetEdges;
  }

  /**
   * Generates edges for the given rectangle.
   */
  private generateRectangleEdges(rect: IRectangle): ISourceEdges {
    return {
      left: {
        depth: rect.x,
        offset: rect.y,
        length: rect.height,
      },

      top: {
        depth: rect.y,
        offset: rect.x,
        length: rect.width,
      },

      right: {
        depth: rect.x + rect.width,
        offset: rect.y,
        length: rect.height,
      },

      bottom: {
        depth: rect.y + rect.height,
        offset: rect.x,
        length: rect.width,
      },
    };
  }
}
