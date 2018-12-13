/**
 * Math for 2d vectors
 */
import { Vector2 } from '../../vendor/threejs/vector2';

// define some syntax sugar for constricting the Vector2 object
export function vec2(): Vec2;
export function vec2(x: number, y: number): Vec2;
export function vec2(model: IVec2): Vec2;
export function vec2(...args: [number, number] | [IVec2] | []): Vec2 {
  if (args.length === 0) return new Vec2(0, 0);
  return (typeof args[0] == 'number') ?
      new Vec2(args[0], args[1]) :
      new Vec2(args[0].x, args[0].y)
}

export class Vec2 extends Vector2 {
  // add new methods here
}
