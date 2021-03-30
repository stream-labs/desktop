import TsxComponent, { createProps } from 'components/tsx-component';
import { IClip, Clip, SCRUB_HEIGHT, SCRUB_WIDTH, SCRUB_FRAMES } from 'services/highlighter';
import { Component } from 'vue-property-decorator';
import path from 'path';

class ClipPreviewProps {
  clip: IClip = null;
}

@Component({ props: createProps(ClipPreviewProps) })
export default class ClipPreview extends TsxComponent<ClipPreviewProps> {
  scrubFrame = 0;

  get filename() {
    return path.basename(this.props.clip.path);
  }

  onMouseMove(e: MouseEvent) {
    const frameIdx = Math.floor((e.offsetX / SCRUB_WIDTH) * SCRUB_FRAMES);

    if (this.scrubFrame !== frameIdx) {
      this.scrubFrame = frameIdx;
    }
  }

  render() {
    return (
      <div style={{ height: `${SCRUB_HEIGHT}px`, position: 'relative' }}>
        <img
          src={this.props.clip.scrubSprite}
          style={{
            width: `${SCRUB_WIDTH}px`,
            height: `${SCRUB_HEIGHT}px`,
            objectFit: 'none',
            objectPosition: `-${this.scrubFrame * SCRUB_WIDTH}px`,
            borderRadius: '10px',
          }}
          onMousemove={this.onMouseMove}
          ref="scrubimg"
        ></img>
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
