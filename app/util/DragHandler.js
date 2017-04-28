import SettingsService from '../services/settings';
import store from '../store';

const { webFrame, screen } = window.require('electron');

// Encapsulates logic for dragging sources in the overlay editor
class DragHandler {

  // startEvent: The mousedown event that started the drag
  constructor(startEvent) {
    this.settingsService = SettingsService.instance;

    // Load some settings we care about
    this.snapEnabled = this.settingsService.state.General.SnappingEnabled;
    this.snapDistance = this.settingsService.state.General.SnapDistance;
    this.edgeSnapping = this.settingsService.state.General.ScreenSnapping;
    this.sourceSnapping = this.settingsService.state.General.SourceSnapping;
    this.centerSnapping = this.settingsService.state.General.CenterSnapping;

    // Load some attributes about the video canvas
    this.baseWidth = store.state.video.width;
    this.baseHeight = store.state.video.height;
    this.renderedWidth = store.state.video.displayOutputRegion.width;
    this.renderedHeight = store.state.video.displayOutputRegion.height;

    // Load some attributes about sources
    this.source = store.getters.activeSource;
    this.otherSources = store.getters.inactiveSources;

    // Store the starting mouse event
    this.currentX = startEvent.pageX;
    this.currentY = startEvent.pageY;
  }

  // event: The mousemove event
  // Should be called when the mouse moves
  move(event) {
    const delta = this.mouseDelta(event);

    // The scaled width and height
    const sourceWidth = this.source.width * this.source.scaleX;
    const sourceHeight = this.source.height * this.source.scaleY;

    // The new source location before applying snapping
    let newX = this.source.x + delta.x;
    let newY = this.source.y + delta.y;

    // Whether or not we snapped the X or Y coordinate
    let snappedX = false;
    let snappedY = false;

    if (this.snapEnabled && this.edgeSnapping) {
      // Left Edge:
      if ((newX < this.snapDistance) && (newX > 0 - this.snapDistance)) {
        newX = 0;
        snappedX = true;
      }

      // Top Edge:
      if ((newY < this.snapDistance) && (newY > 0 - this.snapDistance)) {
        newY = 0;
        snappedY = true;
      }

      // Right Edge:
      const rightEdgeX = newX + sourceWidth;
      const snapRightMin = this.baseWidth - this.snapDistance;
      const snapRightMax = this.baseWidth + this.snapDistance;

      if ((rightEdgeX > snapRightMin) && (rightEdgeX < snapRightMax)) {
        newX = this.baseWidth - sourceWidth;
        snappedX = true;
      }

      // Bottom Edge:
      const bottomEdgeY = newY + sourceHeight;
      const snapBottomMin = this.baseHeight - this.snapDistance;
      const snapBottomMax = this.baseHeight + this.snapDistance;

      if ((bottomEdgeY > snapBottomMin) && (bottomEdgeY < snapBottomMax)) {
        newY = this.baseHeight - sourceHeight;
        snappedY = true;
      }
    }

    store.dispatch({
      type: 'setSourcePosition',
      sourceId: this.source.id,
      x: newX,
      y: newY
    });

    if (!snappedX) {
      this.currentX = event.pageX;
    }

    if (!snappedY) {
      this.currentY = event.pageY;
    }
  }

  // Returns mouse deltas in base space
  mouseDelta(event) {
    // Deltas in rendered space
    const deltaX = event.pageX - this.currentX;
    const deltaY = event.pageY - this.currentY;

    const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;

    return {
      x: (deltaX * factor * this.baseWidth) / this.renderedWidth,
      y: (deltaY * factor * this.baseHeight) / this.renderedHeight
    };
  }

}

export default DragHandler;
