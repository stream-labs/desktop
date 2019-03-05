import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import { isEqual } from 'lodash';

export interface IHScrollModel {
  canScroll: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

/**
 * horizontal scrolling wrapper
 */
@Component({})
export default class HScroll extends Vue {
  model: IHScrollModel = null;

  $refs: {
    track: HTMLElement;
  };

  mounted() {
    new ResizeSensor(this.$el, () => {
      this.onInvalidateHandler();
    });
    this.onInvalidateHandler();
  }

  onWheelHandler(e: WheelEvent) {
    // transform a vertical scrolling to the horizontal scrolling
    e.preventDefault();
    this.$el.scrollBy(e.deltaY, 0);
    this.onInvalidateHandler();
  }

  scrollBy(horizontal: number, vertical: number, animate: boolean = false) {
    this.$el.scrollBy({
      top: vertical,
      left: horizontal,
      behavior: animate ? 'smooth' : 'auto',
    });
    this.onInvalidateHandler();
  }

  /**
   * recalculate scrolling restrictions
   */
  private onInvalidateHandler() {
    const wrapperWidth = this.$el.clientWidth;
    const trackWidth = this.$refs.track.scrollWidth;
    const scrollLeft = this.$el.scrollLeft;
    const canScroll = trackWidth > wrapperWidth;
    const canScrollLeft = canScroll && scrollLeft > 0;
    const canScrollRight = canScroll && trackWidth - wrapperWidth > scrollLeft;
    const model: IHScrollModel = {
      canScroll,
      canScrollLeft,
      canScrollRight,
    };

    // don't fire the 'change' event if nothing has been changed
    if (isEqual(model, this.model)) return;

    this.model = model;
    this.$emit('change', model);
  }
}
