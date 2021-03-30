import TsxComponent from 'components/tsx-component';
import { Clip, CLIP_1, CLIP_2, CLIP_3, CLIP_4, HighlighterService } from 'services/highlighter';
import { Component } from 'vue-property-decorator';
import ClipPreview from 'components/highlighter/ClipPreview';
import { Inject } from 'services';

@Component({
  components: { ClipPreview },
})
export default class Highlighter extends TsxComponent {
  @Inject() highlighterService: HighlighterService;

  get clips() {
    return this.highlighterService.state.clips;
  }

  get loading() {
    return this.highlighterService.state.loading;
  }

  get loadedClips() {
    return this.highlighterService.state.loadedClips;
  }

  get totalClips() {
    return this.highlighterService.state.toLoadClips;
  }

  created() {
    this.highlighterService.initialize();
  }

  render() {
    return (
      <div>
        {this.loading && (
          <div style={{ fontSize: '24px', margin: 'auto' }}>
            Loading: {this.loadedClips}/{this.totalClips} Clips
          </div>
        )}
        {!this.loading &&
          this.clips.map(clip => {
            return <ClipPreview clip={clip} style={{ margin: '10px' }} />;
          })}
      </div>
    );
  }
}
