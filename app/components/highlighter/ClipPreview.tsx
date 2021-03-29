import TsxComponent, { createProps } from 'components/tsx-component';
import { Clip, SCRUB_HEIGHT, SCRUB_WIDTH, SCRUB_FRAMES } from 'services/highlighter';
import { Component } from 'vue-property-decorator';
import path from 'path';
import { throttle } from 'lodash-decorators';

class ClipPreviewProps {
  path: string = '';
}

@Component({ props: createProps(ClipPreviewProps) })
export default class ClipPreview extends TsxComponent<ClipPreviewProps> {
  $refs: {
    canvas: HTMLCanvasElement;
  };

  clip: Clip;

  scrubFrame: number;
  scrubFramesLoaded: boolean;
  ctx: CanvasRenderingContext2D;

  filename: string;

  created() {
    this.filename = path.basename(this.props.path);
  }

  mounted() {
    console.log('mount', this.props.path);
    console.log(this.$refs.canvas);

    this.$refs.canvas.width = SCRUB_WIDTH;
    this.$refs.canvas.height = SCRUB_HEIGHT;
    this.$refs.canvas.style.width = `${SCRUB_WIDTH}px`;
    this.$refs.canvas.style.height = `${SCRUB_HEIGHT}px`;

    this.clip = new Clip(this.props.path);
    this.clip.init().then(() => {
      this.scrubFrame = 0;
      this.scrubFramesLoaded = false;
      this.ctx = this.$refs.canvas.getContext('2d');
      this.clip.frameSource.readScrubbingFrames().then(() => {
        this.scrubFramesLoaded = true;
        this.renderScrubFrame();
      });
    });
  }

  @throttle(50)
  renderScrubFrame() {
    if (!this.scrubFramesLoaded) return;

    const data = new ImageData(
      Uint8ClampedArray.from(this.clip.frameSource.scrubFrames[this.scrubFrame]),
      SCRUB_WIDTH,
      SCRUB_HEIGHT,
    );
    this.ctx.putImageData(data, 0, 0);
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
      <div style={{ height: `${SCRUB_HEIGHT}px`, position: 'relative' }}>
        <canvas
          ref="canvas"
          onMousemove={this.onMouseMove}
          style={{ borderRadius: '10px' }}
        ></canvas>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            width: '100%',
            padding: '0 10px',
            borderRadius: '0 0 10px 10px',
          }}
        >
          {this.filename}
        </div>
      </div>
    );
  }
}
