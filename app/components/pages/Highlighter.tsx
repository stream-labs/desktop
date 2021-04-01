import TsxComponent from 'components/tsx-component';
import { HighlighterService, IClip } from 'services/highlighter';
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

  render() {
    return (
      <div style={{ height: 0 }}>
        {!!this.views.clips.length && !this.views.loaded && (
          <div class={styles.clipLoader}>
            Loading: {this.views.loadedCount}/{this.views.clips.length} Clips
          </div>
        )}
        {!this.views.clips.length && (
          <div style={{ fontSize: '16px', margin: 'auto' }}>
            Start the replay buffer and record some clips to get started!
          </div>
        )}
        {this.views.loaded && !!this.views.clips.length && (
          <div style={{ overflowY: 'auto', width: '100%' }}>
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
        )}
      </div>
    );
  }
}
