/**
 * provides math fore LinesSegments
 */
import { vec2, Vec2 } from './vec2';
import { intersect, Line } from './line';

export class LineSegment extends Line {

  getIntersection(segment: LineSegment): Vec2 {
    return intersect(
      this.v1.x, this.v1.y, this.v2.x, this.v2.y, segment.v1.x, segment.v1.y, segment.v2.x, segment.v2.y, true
    );
  }

  getLenght() {
    return this.v1.distanceTo(this.v2);
  }

  getLine() {
    return new Line(this.v1, this.v2);
  }
}
