import { SettingsService } from '../services/settings';
import { Inject } from '../util/injector';
import { ScenesService, SceneItem } from '../services/scenes';
import { VideoService, Display } from '../services/video';
import { WindowsService } from '../services/windows';
import { ScalableRectangle } from '../util/ScalableRectangle';
import { SelectionService } from 'services/selection';
import electron from 'electron';

const { webFrame, screen } = electron;

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

// A set of edged separated by location
interface IEdgeCollection {
  top: IEdge[];
  bottom: IEdge[];
  left: IEdge[];
  right: IEdge[];
}

// Encapsulates logic for dragging sources in the overlay editor
class DragHandler {

  @Inject() private settingsService: SettingsService;
  @Inject() private scenesService: ScenesService;
  @Inject() private videoService: VideoService;
  @Inject() private windowsService: WindowsService;
  @Inject() private selectionService: SelectionService;


  // Settings
  snapEnabled: boolean;
  renderedSnapDistance: number;
  screenSnapping: boolean;
  sourceSnapping: boolean;
  centerSnapping: boolean;

  // Video Canvas
  baseWidth: number;
  baseHeight: number;
  renderedWidth: number;
  renderedHeight: number;
  scaleFactor: number;
  snapDistance: number;

  // Sources
  private draggedSource: SceneItem;
  private otherSources: SceneItem[];

  // Mouse properties
  currentX: number;
  currentY: number;

  targetEdges: IEdgeCollection;

  // startEvent: The mousedown event that started the drag
  // display: The OBS display object we are operating on
  constructor(startEvent: MouseEvent, display: Display) {
    // Load some settings we care about
    this.snapEnabled = this.settingsService.state.General.SnappingEnabled;
    this.renderedSnapDistance = this.settingsService.state.General.SnapDistance;
    this.screenSnapping = this.settingsService.state.General.ScreenSnapping;
    this.sourceSnapping = this.settingsService.state.General.SourceSnapping;
    this.centerSnapping = this.settingsService.state.General.CenterSnapping;

    // Load some attributes about the video canvas
    this.baseWidth = this.videoService.baseWidth;
    this.baseHeight = this.videoService.baseHeight;
    this.renderedWidth = display.outputRegion.width;
    this.renderedHeight = display.outputRegion.height;
    this.scaleFactor = this.windowsService.state.main.scaleFactor;
    this.snapDistance = (this.renderedSnapDistance * this.scaleFactor * this.baseWidth) /
      this.renderedWidth;

    // Load some attributes about sources
    this.draggedSource = this.selectionService.getLastSelected();
    this.otherSources = this.selectionService
      .clone()
      .invert()
      .getItems()
      .filter(item => item.isVisualSource);
    // Store the starting mouse event
    this.currentX = startEvent.pageX;
    this.currentY = startEvent.pageY;

    // Generate the edges we should snap to
    this.targetEdges = this.generateTargetEdges();
  }

  // Should be called when the mouse moves
  move(event: MouseEvent) {
    const delta = this.mouseDelta(event);

    const rect = new ScalableRectangle(this.draggedSource.getRectangle());
    const denormalize = rect.normalize();

    // The new source location before applying snapping
    let newX = rect.x + delta.x;
    let newY = rect.y + delta.y;

    // Whether or not we snapped the X or Y coordinate
    let snappedX = false;
    let snappedY = false;

    // Holding Ctrl temporary disables snapping
    if (this.snapEnabled && !event.ctrlKey) {
      const sourceEdges = this.generateSourceEdges(rect, newX, newY);

      Object.keys(sourceEdges).forEach(edgeName => {
        const sourceEdge = sourceEdges[edgeName] as IEdge;

        this.targetEdges[edgeName].find((targetEdge: IEdge) => {
          if (this.shouldSnap(sourceEdge, targetEdge)) {
            if ((edgeName === 'left') && !snappedX) {
              snappedX = true;
              newX = targetEdge.depth;
            }

            if ((edgeName === 'right') && !snappedX) {
              snappedX = true;
              newX = targetEdge.depth - rect.scaledWidth;
            }

            if ((edgeName === 'top') && !snappedY) {
              snappedY = true;
              newY = targetEdge.depth;
            }

            if ((edgeName === 'bottom') && !snappedY) {
              snappedY = true;
              newY = targetEdge.depth - rect.scaledHeight;
            }

            // Leave the loop early if we snapped X & Y
            return snappedX && snappedY;
          }
        });
      });
    }

    const dx = newX - rect.x;
    const dy = newY - rect.y;

    denormalize();

    this.selectionService.getItems().forEach(item => {
      const pos = item.transform.position;
      item.setTransform({ position: { x: pos.x + dx, y: pos.y + dy } });
    });

    if (!snappedX) {
      this.currentX = event.pageX;
    }

    if (!snappedY) {
      this.currentY = event.pageY;
    }
  }

  // Private:

  // Returns mouse deltas in base space
  mouseDelta(event: MouseEvent) {
    // Deltas in rendered space
    const deltaX = event.pageX - this.currentX;
    const deltaY = event.pageY - this.currentY;

    return {
      x: (deltaX * this.scaleFactor * this.baseWidth) / this.renderedWidth,
      y: (deltaY * this.scaleFactor * this.baseHeight) / this.renderedHeight
    };
  }

  // A and B are both edges, and this function returns true
  // if they should snap together.  For best results, only
  // compare horizontal edges to other horizontal edges, and
  // vertical edges to other vertical edges.
  shouldSnap(a: IEdge, b: IEdge) {
    // First, check if the edges overlap
    if (a.offset + a.length < b.offset) {
      return false;
    }

    if (b.offset + b.length < a.offset) {
      return false;
    }

    // Next, check if the edges are within snapping depth
    if (Math.abs(a.depth - b.depth) > this.snapDistance) {
      return false;
    }

    return true;
  }

  // Generates the target edges, which are edges that the
  // currently dragged source can snap to.  They are separated
  // by which edge of the source can snap to it.
  generateTargetEdges() {
    const targetEdges: IEdgeCollection = {
      left: [],
      top: [],
      right: [],
      bottom: []
    };

    // Screen edge snapping:
    if (this.screenSnapping) {
      // Screen left
      targetEdges.left.push({
        depth: 0,
        offset: 0,
        length: this.baseHeight
      });

      // Screen top
      targetEdges.top.push({
        depth: 0,
        offset: 0,
        length: this.baseWidth
      });

      // Screen right
      targetEdges.right.push({
        depth: this.baseWidth,
        offset: 0,
        length: this.baseHeight
      });

      // Screen bottom
      targetEdges.bottom.push({
        depth: this.baseHeight,
        offset: 0,
        length: this.baseWidth
      });
    }

    // Source edge snapping:
    if (this.sourceSnapping) {
      this.otherSources.forEach(source => {
        const pos = source.transform.position;
        const edges = this.generateSourceEdges(source.getRectangle(), pos.x, pos.y);

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

  // Generates edges for the given source at
  // the given x & y coordinates
  generateSourceEdges(source: IScalableRectangle, x: number, y: number) {
    const rect = new ScalableRectangle({
      x,
      y,
      width: source.width,
      height: source.height,
      scaleX: source.scaleX,
      scaleY: source.scaleY,
      crop: source.crop,
      rotation: source.rotation
    });

    rect.normalize();

    return {
      left: {
        depth: rect.x,
        offset: rect.y,
        length: rect.scaledHeight
      },

      top: {
        depth: rect.y,
        offset: rect.x,
        length: rect.scaledWidth
      },

      right: {
        depth: rect.x + rect.scaledWidth,
        offset: rect.y,
        length: rect.scaledHeight
      },

      bottom: {
        depth: rect.y + rect.scaledHeight,
        offset: rect.x,
        length: rect.scaledWidth
      }
    };
  }

}

export default DragHandler;
