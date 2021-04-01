import TsxComponent from 'components/tsx-component';
import { EExportStep, HighlighterService, IClip } from 'services/highlighter';
import { Component, Watch } from 'vue-property-decorator';
import ClipPreview from 'components/highlighter/ClipPreview';
import { Inject } from 'services';
import draggable from 'vuedraggable';
import styles from './Highlighter.m.less';

@Component({
  components: { ClipPreview, draggable },
})
export default class Highlighter extends TsxComponent {
  @Inject() highlighterService: HighlighterService;

  get views() {
    return this.highlighterService.views;
  }

  get numClips() {
    return this.highlighterService.views.clips.length;
  }

  created() {
    this.reloadClips();
  }

  @Watch('numClips')
  reloadClips() {
    this.highlighterService.actions.loadClips();
  }

  get clips() {
    return this.views.clips;
  }

  set clips(val: IClip[]) {
    // Intentionally synchronous to avoid visual jank on drop
    this.highlighterService.setOrder(val.map(c => c.path));
  }

  export() {
    this.highlighterService.actions.export();
  }

  getExportView() {
    return (
      <div class={styles.clipLoader}>
        <h2>Export Progress</h2>
        {!this.views.exportInfo.cancelRequested &&
          this.views.exportInfo.step === EExportStep.FrameRender && (
            <span>
              Rendering Frames: {this.views.exportInfo.currentFrame}/
              {this.views.exportInfo.totalFrames}
            </span>
        )}
        {!this.views.exportInfo.cancelRequested &&
          this.views.exportInfo.step === EExportStep.AudioMix && (
            <span>
              Mixing Audio:
              <i class="fa fa-pulse fa-spinner" style={{ marginLeft: '12px' }} />
            </span>
        )}
        {this.views.exportInfo.cancelRequested && <span>Canceling...</span>}
        <br />
        <button
          class="button button--soft-warning"
          onClick={() => this.highlighterService.actions.cancelExport()}
          style={{ marginTop: '16px' }}
          disabled={this.views.exportInfo.cancelRequested}
        >
          Cancel
        </button>
      </div>
    );
  }

  getLoadingView() {
    return (
      <div class={styles.clipLoader}>
        <h2>Loading</h2>
        {this.views.loadedCount}/{this.views.clips.length} Clips
      </div>
    );
  }

  getBlankSlate() {
    return (
      <div style={{ fontSize: '16px', margin: 'auto' }}>
        Start the replay buffer and record some clips to get started!
      </div>
    );
  }

  getClipsView() {
    return (
      <div style={{ width: '100%', display: 'flex' }}>
        <div style={{ overflowY: 'auto' }}>
          <draggable vModel={this.clips} animation={200}>
            {this.views.clips.map(clip => {
              return (
                <ClipPreview
                  clip={clip}
                  style={{ margin: '10px', display: 'inline-block' }}
                  key={clip.path}
                />
              );
            })}
          </draggable>
        </div>
        <div
          style={{
            width: '300px',
            flexShrink: 0,
            background: 'var(--section)',
            borderLeft: '1px solid var(--border)',
            padding: '8px',
          }}
        >
          Controls go here
          <br />
          <button class="button button--action" style={{ marginTop: '16px' }} onClick={this.export}>
            Export
          </button>
        </div>
      </div>
    );
  }

  getContent() {
    if (this.views.exportInfo.exporting) return this.getExportView();
    if (!this.views.clips.length) return this.getBlankSlate();
    if (!this.views.loaded) return this.getLoadingView();
    return this.getClipsView();
  }

  render() {
    return <div style={{ height: 0 }}>{this.getContent()}</div>;
  }
}
