import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

/**
 * This component can be added to any element as a resize control
 */
@Component({})
export default class ResizeBar extends Vue {
  // the side of the external container to stick ResizeBar to
  @Prop({ default: 'left' })
  position: 'left' | 'right' | 'top'; // TODO: bottom if needed

  @Prop({ default: 0 })
  value: number;

  @Prop({ default: -Infinity })
  min: number;

  @Prop({ default: Infinity })
  max: number;

  // by default ResizeBar increases the value when move to bottom/right
  // and decreases when move to left/top
  // change this option to reverse this behavior
  @Prop({ default: false })
  reverse: number;

  active = false; // true when it's dragging
  transform = ''; // css-transform prop ResizeBar

  private barOffset = 0;
  private mouseOffset = 0;

  private get hasConstraints() {
    return this.max !== Infinity || this.min !== -Infinity;
  }

  onMouseDownHandler(event: MouseEvent) {
    this.startMouseTracking(event);
  }

  startMouseTracking(event: MouseEvent) {
    this.active = true;
    const mouseMoveListener = (event: MouseEvent) => this.onMouseMoveHandler(event);
    this.$root.$el.addEventListener('mousemove', mouseMoveListener);
    this.$root.$el.addEventListener(
      'mouseup',
      (event: MouseEvent) => {
        this.$root.$el.removeEventListener('mousemove', mouseMoveListener);
        this.stopMouseTracking(event);
      },
      { once: true },
    );
    this.$emit('onresizestart', event);
  }

  stopMouseTracking(event: MouseEvent) {
    this.$root.$off('mousemove', this.onMouseMoveHandler);
    this.active = false;
    let offset = this.barOffset;
    if (this.reverse) offset = -offset;
    this.barOffset = 0;
    this.mouseOffset = 0;
    this.updateTransform();
    this.$emit('onresizestop', offset, event);
    this.$emit('input', offset + this.value, event);
  }

  onMouseMoveHandler(event: MouseEvent) {
    // save mouse offset
    const movement = ['left', 'right'].includes(this.position) ? event.movementX : event.movementY;
    this.mouseOffset += movement;

    // handle max and min constraints
    if (this.hasConstraints) {
      const value = this.reverse ? this.value - this.mouseOffset : this.value + this.mouseOffset;
      if (value <= this.max && value >= this.min) {
        this.barOffset += movement;
      }
    } else {
      this.barOffset += movement;
    }

    this.updateTransform();
  }

  private updateTransform() {
    this.transform = ['left', 'right'].includes(this.position)
      ? `translateX(${this.barOffset}px)`
      : `translateY(${this.barOffset}px)`;
  }
}
