/**
 * provides math fore Lines
 * There is a good example of the Line class:
 * @see https://github.com/paperjs/paper.js/blob/develop/src/basic/Line.js
 */
import { vec2, Vec2 } from './vec2';

export class Line {

  v1: Vec2;
  v2: Vec2;

  constructor(v1: IVec2, v2: IVec2) {
    this.v1 = vec2(v1);
    this.v2 = vec2(v2);
  }

  getIntersection(line: Line): Vec2 {
    return intersect(this.v1.x, this.v1.y, this.v2.x, this.v2.y, line.v1.x, line.v1.y, line.v2.x, line.v2.y);
  }
}

/**
 * line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
 * Determine the intersection point of two lines/line segments
 * Return null if the lines don't intersect
 * Check if none of the lines are of length 0
 */

export function intersect(
  x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number,
  isSegment = false
) {

  if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
    return null;
  }

  const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

  // Lines are parallel
  if (denominator === 0) {
    return null;
  }

  let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

  // is the intersection along the segments
  if (isSegment && (ua < 0 || ua > 1 || ub < 0 || ub > 1)) {
    return null;
  }

  // Return a object with the x and y coordinates of the intersection
  let x = x1 + ua * (x2 - x1);
  let y = y1 + ua * (y2 - y1);

  return vec2(x, y);
}
