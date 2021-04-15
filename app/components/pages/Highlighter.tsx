import TsxComponent from 'components/tsx-component';
import { EExportStep, HighlighterService, IClip } from 'services/highlighter';
import { Component, Watch } from 'vue-property-decorator';
import { ClipPreview } from 'components/shared/ReactComponent';
import { Inject } from 'services';
import draggable from 'vuedraggable';
import styles from './Highlighter.m.less';
import { ListInput } from 'components/shared/inputs/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { metadata } from 'components/shared/inputs';

@Component({
  components: { ClipPreview, draggable, ListInput },
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

  get transitionTypeMetadata() {
    return metadata.list({
      title: 'Transition Type',
      options: this.highlighterService.views.transitions.map((transition: any) => {
        return {
          value: transition.name,
          title: transition.name,
        };
      }),
    });
  }

  get transitionType() {
    return this.highlighterService.views.transition.type;
  }

  set transitionType(val: string) {
    this.highlighterService.actions.setTransition({ type: val });
  }

  get transitionDurationMetadata() {
    return metadata.slider({
      title: 'Transition Duration',
      min: 0.5,
      max: 5,
      interval: 0.1,
    });
  }

  get transitionDuration() {
    return this.highlighterService.views.transition.duration;
  }

  set transitionDuration(val: number) {
    this.highlighterService.actions.setTransition({ duration: val });
  }

  get exportFileMetadata() {
    return metadata.file({
      title: 'Export File',
      save: true,
      filters: [{ name: 'MP4 Video File', extensions: ['mp4'] }],
    });
  }

  get exportFile() {
    return this.highlighterService.views.exportInfo.file;
  }

  set exportFile(val: string) {
    this.highlighterService.actions.setExportFile(val);
  }

  getControls() {
    return (
      <div
        style={{
          width: '300px',
          flexShrink: 0,
          background: 'var(--section)',
          borderLeft: '1px solid var(--border)',
          padding: '20px',
        }}
      >
        <VFormGroup metadata={this.transitionTypeMetadata} vModel={this.transitionType} />
        <VFormGroup metadata={this.transitionDurationMetadata} vModel={this.transitionDuration} />
        <VFormGroup metadata={this.exportFileMetadata} vModel={this.exportFile} />
        <button class="button button--action" style={{ marginTop: '16px' }} onClick={this.export}>
          Export
        </button>
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
                  componentProps={{ clip }}
                  style={{ margin: '10px', display: 'inline-block' }}
                  key={clip.path}
                />
              );
            })}
          </draggable>
        </div>
        {this.getControls()}
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
