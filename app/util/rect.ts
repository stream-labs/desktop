import { v2, Vec2 } from './vec2';

/**
 * Class for a simple rectangle
 */
export class Rect implements IRectangle {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(options: IRectangle) {
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;
  }

  getAspectRatio() {
    return this.width / this.height;
  }

  getPosition(): Vec2 {
    return v2(this.x, this.y);
  }

  setPosition(pos: IVec2) {
    this.x = pos.x;
    this.y = pos.y;
  }

  getSize(): Vec2 {
    return v2(this.width, this.height);
  }

  /**
   * returns the relative distance from the rectangle to point
   * { x: 0, y: 0 } is top-left corner
   * { x: 1, y: 1 } is bottom-right corner
   */
  getOriginFromOffset(offset: IVec2): Vec2 {
    return v2((offset.x - this.x) / this.width, (offset.y - this.y) / this.height);
  }

  /**
   * opposite for `.getOriginFromOffset()`
   * returns the absolute point offset based on the relative origin param
   */
  getOffsetFromOrigin(origin: IVec2): Vec2 {
    return v2(this.x + this.width * origin.x, this.y + this.height * origin.y);
  }
}
