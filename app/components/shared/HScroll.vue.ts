import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';

export interface IHScrollModel {
  canScroll: boolean;
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
      this.onResizeHandler();
    });
    this.onResizeHandler();
  }

  onWheelHandler(e: WheelEvent) {
    e.preventDefault();
    this.$el.scrollBy(e.deltaY, 0);
  }

  private onResizeHandler() {
    const wrapperWidth = this.$el.clientWidth;
    const trackWidth = this.$refs.track.scrollWidth;
    const model = {
      canScroll: trackWidth > wrapperWidth
    };

    const modelIsChanged = !this.model || this.model.canScroll !== model.canScroll;
    if (!modelIsChanged) return;

    this.model = model;
    this.$emit('change', model);
  }
}
