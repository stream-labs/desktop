import _ from 'lodash';
import SettingsService from '../services/settings';
import store from '../store';
import ScenesService from '../services/scenes';

const { webFrame, screen } = window.require('electron');

// Encapsulates logic for dragging sources in the overlay editor
class DragHandler {

  // startEvent: The mousedown event that started the drag
  constructor(startEvent) {
    this.settingsService = SettingsService.instance;

    // Load some settings we care about
    this.snapEnabled = this.settingsService.state.General.SnappingEnabled;
    this.renderedSnapDistance = this.settingsService.state.General.SnapDistance;
    this.screenSnapping = this.settingsService.state.General.ScreenSnapping;
    this.sourceSnapping = this.settingsService.state.General.SourceSnapping;
    this.centerSnapping = this.settingsService.state.General.CenterSnapping;

    // Load some attributes about the video canvas
    this.baseWidth = store.state.video.width;
    this.baseHeight = store.state.video.height;
    this.renderedWidth = store.state.video.displayOutputRegion.width;
    this.renderedHeight = store.state.video.displayOutputRegion.height;
    this.scaleFactor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;
    this.snapDistance = (this.renderedSnapDistance * this.scaleFactor * this.baseWidth) /
      this.renderedWidth;

    // Load some attributes about sources
    this.draggedSource = ScenesService.instance.activeSource;
    this.otherSources = ScenesService.instance.inactiveSources.filter(source => {
      // Only video targets are valid snap targets
      return source.video;
    });

    // Store the starting mouse event
    this.currentX = startEvent.pageX;
    this.currentY = startEvent.pageY;

    // Generate the edges we should snap to
    this.targetEdges = this.generateTargetEdges();
  }

  // event: The mousemove event
  // Should be called when the mouse moves
  move(event) {
    const delta = this.mouseDelta(event);

    // The new source location before applying snapping
    let newX = this.draggedSource.x + delta.x;
    let newY = this.draggedSource.y + delta.y;

    // Whether or not we snapped the X or Y coordinate
    let snappedX = false;
    let snappedY = false;

    // Holding Ctrl temporary disables snapping
    if (this.snapEnabled && !event.ctrlKey) {
      const sourceEdges = this.generateSourceEdges(this.draggedSource, newX, newY);

      _.each(sourceEdges, (sourceEdge, name) => {
        _.find(this.targetEdges[name], targetEdge => {
          if (this.shouldSnap(sourceEdge, targetEdge)) {
            if (name === 'left') {
              snappedX = true;
              newX = targetEdge.depth;
            } else if (name === 'top') {
              snappedY = true;
              newY = targetEdge.depth;
            } else if (name === 'right') {
              snappedX = true;
              newX = targetEdge.depth - (this.draggedSource.scaledWidth);
            } else {
              snappedY = true;
              newY = targetEdge.depth - (this.draggedSource.scaledHeight);
            }
          }
        });
      });
    }

    ScenesService.instance.setSourcePosition(
      ScenesService.instance.activeSceneId,
      this.draggedSource.id,
      newX,
      newY
    );

    if (!snappedX) {
      this.currentX = event.pageX;
    }

    if (!snappedY) {
      this.currentY = event.pageY;
    }
  }

  // Private:

  // Returns mouse deltas in base space
  mouseDelta(event) {
    // Deltas in rendered space
    const deltaX = event.pageX - this.currentX;
    const deltaY = event.pageY - this.currentY;

    return {
      x: (deltaX * this.scaleFactor * this.baseWidth) / this.renderedWidth,
      y: (deltaY * this.scaleFactor * this.baseHeight) / this.renderedHeight
    };
  }

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

  // A and B are both edges, and this function returns true
  // if they should snap together.  For best results, only
  // compare horizontal edges to other horizontal edges, and
  // vertical edges to other vertical edges.
  shouldSnap(a, b) {
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
    const targetEdges = {
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
        depth: this.baseWidth - 1,
        offset: 0,
        length: this.baseHeight
      });

      // Screen bottom
      targetEdges.bottom.push({
        depth: this.baseHeight - 1,
        offset: 0,
        length: this.baseWidth
      });
    }

    // Source edge snapping:
    if (this.sourceSnapping) {
      this.otherSources.forEach(source => {
        const edges = this.generateSourceEdges(source, source.x, source.y);

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
  generateSourceEdges(source, x, y) {
    return {
      left: {
        depth: x,
        offset: y,
        length: source.scaledHeight
      },

      top: {
        depth: y,
        offset: x,
        length: source.scaledWidth
      },

      right: {
        depth: x + source.scaledWidth,
        offset: y,
        length: source.scaledHeight
      },

      bottom: {
        depth: y + source.scaledHeight,
        offset: x,
        length: source.scaledWidth
      }
    };
  }

}

export default DragHandler;
