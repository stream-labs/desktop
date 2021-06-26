import createTransition from './create-transition';
import transitions from 'gl-transitions';
import { Texture2D } from './texture-2d';
import {
  FRAME_BYTE_SIZE,
  HEIGHT,
  PREVIEW_FRAME_BYTE_SIZE,
  PREVIEW_HEIGHT,
  PREVIEW_WIDTH,
  WIDTH,
} from './constants';

export class Transitioner {
  private canvas = document.createElement('canvas');
  private gl = this.canvas.getContext('webgl')!;

  readonly width = this.preview ? PREVIEW_WIDTH : WIDTH;
  readonly height = this.preview ? PREVIEW_HEIGHT : HEIGHT;

  private readBuffer = Buffer.allocUnsafe(this.preview ? PREVIEW_FRAME_BYTE_SIZE : FRAME_BYTE_SIZE);

  private transitionSrc: any;

  constructor(
    public readonly transitionType: string,
    public readonly preview: boolean,
    public readonly params: { [key: string]: any } = {},
  ) {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

    this.transitionSrc = transitions.find((t: any) => t.name === this.transitionType);
  }

  renderTransition(fromFrame: Buffer, toFrame: Buffer, progress: number) {
    const transition = createTransition(this.gl, this.transitionSrc);
    const fromTexture = new Texture2D(this.gl, this.width, this.height, fromFrame);
    const toTexture = new Texture2D(this.gl, this.width, this.height, toFrame);
    const buffer = this.gl.createBuffer();

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 4, 4, -1]),
      this.gl.STATIC_DRAW,
    );
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    transition.draw(
      progress,
      fromTexture,
      toTexture,
      this.gl.drawingBufferWidth,
      this.gl.drawingBufferHeight,
      this.params,
    );

    fromTexture.dispose();
    toTexture.dispose();
  }

  getFrame(): Buffer {
    this.gl.readPixels(
      0,
      0,
      this.width,
      this.height,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      this.readBuffer,
    );

    return this.readBuffer;
  }
}
