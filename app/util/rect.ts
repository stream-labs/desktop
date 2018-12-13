import { Vec2, vec2 } from './vec2';
import { Path } from '../../vendor/paper/basic';
import { Line } from './line';
import { uniqWith, without, isEqual } from 'lodash';

/**
 * provides math fore rectangles
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


  getModel(): IRectangle {
    return {
      x: this.x,
      y: this.y,
      height: this.height,
      width: this.width
    }
  }

  /**
   * returns the relative distance from the rectangle to point
   */
  getOriginFromOffset(offset: IVec2): Vec2 {
    return vec2(
      (offset.x - this.x) / this.width,
      (offset.y - this.y) / this.height
    );
  }

  /**
   * opposite for `getOriginFromOffset()`
   * returns the absolute point offset based on the relative origin param
   */
  getOffsetFromOrigin(origin: IVec2): Vec2 {
    return vec2(
      this.x + this.width * origin.x,
      this.y + this.height * origin.y
    )
  }

  /**
   * returns intersection points
   */
  getIntersections(line: Line): [Vec2?, Vec2?] {
    const lines = this.getLines();
    let intersections = [
      line.getIntersection(lines[0]),
      line.getIntersection(lines[1]),
      line.getIntersection(lines[2]),
      line.getIntersection(lines[3]),
    ];
    intersections = uniqWith(intersections, isEqual);
    return without(intersections, null) as [Vec2?, Vec2?];
  }

  /**
   * returns edges lines in CW direction
   */
  getLines(): [Line, Line, Line, Line] {
    const [vx1, vx2, vx3, vx4] = this.getVertices();
    return [
      new Line(vx1, vx2),
      new Line(vx2, vx3),
      new Line(vx3, vx4),
      new Line(vx4, vx1),
    ]
  }

  /**
   * returns vertices in CW direction
   */
  getVertices(): [Vec2, Vec2, Vec2, Vec2] {
    return [
      vec2(this.x, this.y),
      vec2(this.x + this.width, this.y),
      vec2(this.x + this.width, this.y + this.height),
      vec2(this.x,this.y + this.height),
    ]
  }
}
