import TsxComponent, { createProps } from 'components/tsx-component';
import { CLIP_1, FrameSource, SCRUB_HEIGHT, SCRUB_WIDTH, SCRUB_FRAMES } from 'services/highlighter';
import { Component } from 'vue-property-decorator';

class ClipProps {
  path: string = '';
}

@Component({ props: createProps(ClipProps) })
export default class Clip extends TsxComponent<ClipProps> {
  $refs: {
    canvas: HTMLCanvasElement;
  };

  frameSource: FrameSource;

  scrubFrame: number;
  scrubFramesLoaded: boolean;
  ctx: CanvasRenderingContext2D;

  mounted() {
    console.log('mount', this.props.path);
    console.log(this.$refs.canvas);

    this.frameSource = new FrameSource(this.props.path);

    this.$refs.canvas.width = SCRUB_WIDTH;
    this.$refs.canvas.height = SCRUB_HEIGHT;
    this.$refs.canvas.style.width = `${SCRUB_WIDTH}px`;
    this.$refs.canvas.style.height = `${SCRUB_HEIGHT}px`;

    this.scrubFrame = 0;
    this.scrubFramesLoaded = false;
    this.ctx = this.$refs.canvas.getContext('2d');
    this.frameSource.readScrubbingFrames().then(() => {
      this.scrubFramesLoaded = true;
      this.renderScrubFrame();
    });
  }

  renderScrubFrame() {
    if (!this.scrubFramesLoaded) return;

    const data = new ImageData(
      Uint8ClampedArray.from(this.frameSource.scrubFrames[this.scrubFrame]),
      SCRUB_WIDTH,
      SCRUB_HEIGHT,
    );
    this.ctx.putImageData(data, 0, 0);
  }

  readNextFrame() {
    console.log('READ NEXT');

    // this.frameSource.readNextFrame().then(() => {
    //   console.log('Frame read complete', this.frameSource.readBuffer);
    //   const ctx = this.$refs.canvas.getContext('2d');
    //   const data = new ImageData(
    //     Uint8ClampedArray.from(this.frameSource.readBuffer),
    //     this.frameSource.width,
    //     this.frameSource.height,
    //   );
    //   ctx.putImageData(data, 0, 0);
    // });
  }

  onMouseMove(e: MouseEvent) {
    const frameIdx = Math.floor((e.offsetX / this.$refs.canvas.width) * SCRUB_FRAMES);

    if (this.scrubFrame !== frameIdx) {
      this.scrubFrame = frameIdx;
      this.renderScrubFrame();
    }
  }

  render() {
    return (
      <div>
        <canvas ref="canvas" onMousemove={this.onMouseMove}></canvas>
      </div>
    );
  }
}
