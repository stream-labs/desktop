import TsxComponent from 'components/tsx-component';
import { CLIP_1, FrameSource } from 'services/highlighter';
import { Component } from 'vue-property-decorator';

@Component({})
export default class Highlighter extends TsxComponent {
  $refs: {
    canvas: HTMLCanvasElement;
  };

  frameSource = new FrameSource(CLIP_1);

  mounted() {
    console.log('mount');
    console.log(this.$refs.canvas);

    this.$refs.canvas.width = 1280;
    this.$refs.canvas.height = 720;
    this.$refs.canvas.style.width = '1280px';
    this.$refs.canvas.style.height = '720px';
  }

  readNextFrame() {
    console.log('READ NEXT');

    this.frameSource.readNextFrame().then(() => {
      console.log('Frame read complete', this.frameSource.readBuffer);
      const ctx = this.$refs.canvas.getContext('2d');
      const data = new ImageData(Uint8ClampedArray.from(this.frameSource.readBuffer), 1280, 720);
      ctx.putImageData(data, 0, 0);
    });
  }

  render() {
    return (
      <div>
        <button onClick={this.readNextFrame}>Next Frame</button>
        <canvas ref="canvas"></canvas>
      </div>
    );
  }
}
