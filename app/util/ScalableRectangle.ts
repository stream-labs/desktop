// This class is used for simplifying math that deals
// with rectangles that can be scaled, including
// negative scales.

interface ScalableRectangleOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX?: number;
  scaleY?: number;
}


export enum AnchorPoint {
  North,
  NorthEast,
  East,
  SouthEast,
  South,
  SouthWest,
  West,
  NorthWest
}


// Positions on a positive unit grid
const AnchorPositions = {
  [AnchorPoint.North]: { x: 0.5, y: 0 },
  [AnchorPoint.NorthEast]: { x: 1, y: 0 },
  [AnchorPoint.East]: { x: 1, y: 0.5 },
  [AnchorPoint.SouthEast]: { x: 1, y: 1 },
  [AnchorPoint.South]: { x: 0.5, y: 1 },
  [AnchorPoint.SouthWest]: { x: 0, y: 1 },
  [AnchorPoint.West]: { x: 0, y: 0.5 },
  [AnchorPoint.NorthWest]: { x: 0, y: 0 }
};


export class ScalableRectangle {

  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  width: number;
  height: number;

  private anchor: AnchorPoint;


  constructor(options: ScalableRectangleOptions) {
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;
    this.scaleX = options.scaleX || 1.0;
    this.scaleY = options.scaleY || 1.0;
    this.anchor = AnchorPoint.NorthWest;
  }


  get scaledWidth() {
    return this.scaleX * this.width;
  }


  get scaledHeight() {
    return this.scaleY * this.height;
  }


  setAnchor(anchor: AnchorPoint) {
    // We need to calculate the distance to the new anchor point
    const currentPosition = AnchorPositions[this.anchor];
    const newPosition = AnchorPositions[anchor];

    const deltaX = newPosition.x - currentPosition.x;
    const deltaY = newPosition.y - currentPosition.y;

    this.x += deltaX * this.scaledWidth;
    this.y += deltaY * this.scaledHeight;

    this.anchor = anchor;
  }


  // Executes the function with a specific anchor point, after
  // which it is returned to its original anchor point.
  withAnchor(anchor: AnchorPoint, fun: Function) {
    const oldAnchor = this.anchor;
    this.setAnchor(anchor);

    fun();

    this.setAnchor(oldAnchor);
  }


  // Normalizes this rectangle into a rectangle that does not
  // have any negative scales.  It returns a function that
  // can be used to undo the operation.
  normalize(): () => void {
    const xFlipped = this.scaleX < 0;
    const yFlipped = this.scaleY < 0;

    if (xFlipped) this.flipX();
    if (yFlipped) this.flipY();

    return () => {
      if (xFlipped) this.flipX();
      if (yFlipped) this.flipY();
    };
  }


  // This is a convenience method that will run the passed
  // function in a normalized environment, and then return
  // it back to its original state afterwards.
  normalized(fun: Function) {
    const denormalize = this.normalize();

    fun();

    denormalize();
  }


  flipX() {
    this.scaleX *= -1;
    this.x -= this.scaledWidth;
  }


  flipY() {
    this.scaleY *= -1;
    this.y -= this.scaledHeight;
  }

}
