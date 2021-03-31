import TsxComponent, { createProps } from 'components/tsx-component';
import {
  IClip,
  SCRUB_HEIGHT,
  SCRUB_WIDTH,
  SCRUB_FRAMES,
  HighlighterService,
} from 'services/highlighter';
import { Component } from 'vue-property-decorator';
import path from 'path';
import BoolButtonInput from 'components/shared/inputs/BoolButtonInput';
import { Inject } from 'services';

class ClipPreviewProps {
  clip: IClip = null;
}

@Component({ props: createProps(ClipPreviewProps) })
export default class ClipPreview extends TsxComponent<ClipPreviewProps> {
  @Inject() highlighterService: HighlighterService;

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

  setEnabled(enabled: boolean) {
    this.highlighterService.actions.enableClip(this.props.clip.path, enabled);
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
            opacity: this.props.clip.enabled ? 1.0 : 0.3,
          }}
          onMousemove={this.onMouseMove}
        ></img>
        <BoolButtonInput
          value={this.props.clip.enabled}
          onInput={this.setEnabled}
          style={{ position: 'absolute', top: '10px', left: '10px' }}
          checkboxStyles={{
            width: '16px',
            height: '16px',
            fontSize: '10px',
            background: 'white',
            borderColor: '#333',
          }}
          checkboxActiveStyles={{ background: 'var(--teal-hover)' }}
        />
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
