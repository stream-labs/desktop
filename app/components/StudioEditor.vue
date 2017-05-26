<template>
<div
  class="StudioEditor-display"
  ref="display"
  @mousedown="handleMouseDown"
  @mouseup="handleMouseUp"
  @mousemove="handleMouseMove"
  @mouseenter="handleMouseEnter"/>
</template>

<script>
import _ from 'lodash';
import DragHandler from '../util/DragHandler';
import ScenesService from '../services/scenes';
import VideoService from '../services/video';
import { SourceMenu } from '../util/menus/SourceMenu.ts';
import { ScalableRectangle, AnchorPoint } from '../util/ScalableRectangle.ts';

const { webFrame, screen } = window.require('electron');

export default {

  mounted() {
    this.obsDisplay = VideoService.instance.createDisplay();

    this.obsDisplay.onOutputResize(outputRegion => {
      this.renderedWidth = outputRegion.width;
      this.renderedHeight = outputRegion.height;
      this.renderedOffsetX = outputRegion.x;
      this.renderedOffsetY = outputRegion.y;
    });

    this.onResize();

    window.addEventListener('resize', this.onResize);
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);

    this.obsDisplay.destroy();
  },

  data() {
    return {
      renderedWidth: 0,
      renderedHeight: 0,

      renderedOffsetX: 0,
      renderedOffsetY: 0
    };
  },

  methods: {
    onResize() {
      const display = this.$refs.display;
      const rect = display.getBoundingClientRect();
      const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;

      this.obsDisplay.resize(
        rect.width * factor,
        rect.height * factor
      );

      this.obsDisplay.move(
        rect.left * factor,
        rect.top * factor
      );
    },

    /*****************
    * Mouse Handling *
    *****************/

    handleMouseDown(event) {
      if (this.activeSource) {
        const overResize = this.isOverResize(event);

        if (overResize) {
          this.startResizing(event, overResize);
          return;
        }
      }

      this.updateCursor(event);
    },

    startDragging(event) {
      this.dragHandler = new DragHandler(event, this.obsDisplay);
    },

    startResizing(event, region) {
      this.resizeRegion = region;
      this.currentX = event.pageX;
      this.currentY = event.pageY;
    },

    handleMouseUp(event) {
      // If neither a drag or resize was initiated, it must have been
      // an attempted selection or right click.
      if (!this.dragHandler && !this.resizeRegion) {
        const overSource = this.sources.find(source => {
          return this.isOverSource(event, source);
        });

        // Either select a new source, or deselect all sources (null)
        ScenesService.instance.makeSourceActive(
          ScenesService.instance.activeSceneId,
          overSource ? overSource.id : null
        );

        if ((event.button === 2) && overSource) {
          const menu = new SourceMenu(
            ScenesService.instance.activeSceneId,
            overSource.id
          );
          menu.popup();
        }
      }

      this.dragHandler = null;
      this.resizeRegion = null;

      this.updateCursor(event);
    },

    handleMouseEnter(event) {
      if (event.buttons !== 1) {
        this.dragHandler = null;
        this.resizeRegion = null;
      }
    },

    handleMouseMove(event) {
      const mousePosX = event.offsetX - this.renderedOffsetX;
      const mousePosY = event.offsetY - this.renderedOffsetY;

      const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;
      const converted = this.convertScalarToBaseSpace(
        mousePosX * factor,
        mousePosY * factor
      );

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
          w: { anchor: AnchorPoint.East, lockY: true }
        };

        const options = {
          ...optionsMap[name],
          lockRatio: !event.shiftKey
        };

        this.resize(converted.x, converted.y, options);
      } else if (this.dragHandler) {
        this.dragHandler.move(event);
      } else if (event.buttons === 1) {
        // We might need to start dragging
        const sourcesInPriorityOrder = _.compact([this.activeSource].concat(this.sources));

        const overSource = sourcesInPriorityOrder.find(source => {
          return this.isOverSource(event, source);
        });

        if (overSource) {
          // Make this source active
          ScenesService.instance.makeSourceActive(
            ScenesService.instance.activeSceneId,
            overSource.id
          );

          // Start dragging it
          this.startDragging(event);
        }
      }

      this.updateCursor(event);
    },

    // x & y are mouse positions in video space
    // options:
    //  - anchor: an AnchorPoint enum to resize around
    //  - lockRatio: preserve the aspect ratio (default: true)
    //  - lockX: prevent changes to the X scale (default: false)
    //  - lockY: prevent changes to the Y scale (default: false)
    resize(x, y, options) {
      // Set defaults
      const opts = {
        lockRatio: true,
        lockX: false,
        lockY: false,
        ...options
      };

      const source = this.activeSource;
      const rect = new ScalableRectangle(source);

      rect.normalized(() => {
        rect.withAnchor(opts.anchor, () => {
          const distanceX = Math.abs(x - rect.x);
          const distanceY = Math.abs(y - rect.y);

          let newScaleX = distanceX / rect.width;
          let newScaleY = distanceY / rect.height;

          // To preserve aspect ratio, take the bigger of the
          // two new scales.
          if (opts.lockRatio) {
            if (Math.abs(newScaleX) > Math.abs(newScaleY)) {
              newScaleY = newScaleX;
            } else {
              newScaleX = newScaleY;
            }
          }

          // Aspect ratio preservation overrides lockX and lockY
          if (!opts.lockX || opts.lockRatio) rect.scaleX = newScaleX;
          if (!opts.lockY || opts.lockRatio) rect.scaleY = newScaleY;
        });
      });

      ScenesService.instance.setSourcePositionAndScale(
        ScenesService.instance.activeSceneId,
        source.id,
        rect.x,
        rect.y,
        rect.scaleX,
        rect.scaleY
      );
    },

    updateCursor(event) {
      if (this.dragHandler) {
        this.$refs.display.style.cursor = '-webkit-grabbing';
      } else if (this.resizeRegion) {
        this.$refs.display.style.cursor = this.resizeRegion.cursor;
      } else {
        const overResize = this.isOverResize(event);

        if (overResize) {
          this.$refs.display.style.cursor = overResize.cursor;
        } else {
          const overSource = _.find(this.sources, source => {
            return this.isOverSource(event, source);
          });

          if (overSource) {
            this.$refs.display.style.cursor = '-webkit-grab';
          } else {
            this.$refs.display.style.cursor = 'default';
          }
        }
      }
    },

    // Takes the given mouse event, and determines if it is
    // over the given box in base resolution space.
    isOverBox(event, x, y, width, height) {
      const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;

      const mouse = this.convertVectorToBaseSpace(
        event.offsetX * factor,
        event.offsetY * factor
      );

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
    },

    // Determines if the given mouse event is over the
    // given source
    isOverSource(event, source) {
      const rect = new ScalableRectangle(source);
      rect.normalize();

      return this.isOverBox(
        event,
        rect.x,
        rect.y,
        rect.scaledWidth,
        rect.scaledHeight
      );
    },

    // Determines if the given mouse event is over any
    // of the active source's resize regions.
    isOverResize(event) {
      if (this.activeSource) {
        return _.find(this.resizeRegions, region => {
          return this.isOverBox(event, region.x, region.y, region.width, region.height);
        });
      }

      return null;
    },

    // Size (width & height) is a scalar value, and
    // only needs to be scaled when converting between
    // spaces.
    convertScalarToBaseSpace(x, y) {
      return {
        x: (x * this.baseWidth) / this.renderedWidth,
        y: (y * this.baseHeight) / this.renderedHeight
      };
    },

    // Position is a vector value. When converting between
    // spaces, we have to add positional offsets.
    convertVectorToBaseSpace(x, y) {
      const movedX = x - this.renderedOffsetX;
      const movedY = y - this.renderedOffsetY;

      return this.convertScalarToBaseSpace(movedX, movedY);
    }
  },

  computed: {
    activeSource() {
      return ScenesService.instance.activeSource;
    },

    sources() {
      if (ScenesService.instance.activeSceneId) {
        return ScenesService.instance.sources.filter(source => {
          // We only care about sources with video
          return source.video;
        });
      }

      return [];
    },

    baseWidth() {
      return VideoService.instance.baseWidth;
    },

    baseHeight() {
      return VideoService.instance.baseHeight;
    },

    // Using a computed property since it is cached
    resizeRegions() {
      if (!this.activeSource) {
        return [];
      }

      const source = this.activeSource;
      const renderedRegionRadius = 5;
      const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;
      const regionRadius = renderedRegionRadius * factor * this.baseWidth / this.renderedWidth;
      const width = regionRadius * 2;
      const height = regionRadius * 2;

      const rect = new ScalableRectangle(source);
      rect.normalize();

      return [
        {
          name: 'nw',
          x: rect.x - regionRadius,
          y: rect.y - regionRadius,
          width,
          height,
          cursor: 'nwse-resize'
        },
        {
          name: 'n',
          x: (rect.x + (rect.scaledWidth / 2)) - regionRadius,
          y: rect.y - regionRadius,
          width,
          height,
          cursor: 'ns-resize'
        },
        {
          name: 'ne',
          x: (rect.x + rect.scaledWidth) - regionRadius,
          y: rect.y - regionRadius,
          width,
          height,
          cursor: 'nesw-resize'
        },
        {
          name: 'e',
          x: (rect.x + rect.scaledWidth) - regionRadius,
          y: (rect.y + (rect.scaledHeight / 2)) - regionRadius,
          width,
          height,
          cursor: 'ew-resize'
        },
        {
          name: 'se',
          x: (rect.x + rect.scaledWidth) - regionRadius,
          y: (rect.y + rect.scaledHeight) - regionRadius,
          width,
          height,
          cursor: 'nwse-resize'
        },
        {
          name: 's',
          x: (rect.x + (rect.scaledWidth / 2)) - regionRadius,
          y: (rect.y + rect.scaledHeight) - regionRadius,
          width,
          height,
          cursor: 'ns-resize'
        },
        {
          name: 'sw',
          x: rect.x - regionRadius,
          y: (rect.y + rect.scaledHeight) - regionRadius,
          width,
          height,
          cursor: 'nesw-resize'
        },
        {
          name: 'w',
          x: rect.x - regionRadius,
          y: (rect.y + (rect.scaledHeight / 2)) - regionRadius,
          width,
          height,
          cursor: 'ew-resize'
        }
      ];
    }
  }

};
</script>

<style lang="less" scoped>
.StudioEditor-display {
  position: relative;
  flex-grow: 1;
  background-color: #222;
}
</style>
