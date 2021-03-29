import TsxComponent from 'components/tsx-component';
import { CLIP_1, CLIP_2, CLIP_3, CLIP_4 } from 'services/highlighter';
import { Component } from 'vue-property-decorator';
import ClipPreview from 'components/highlighter/ClipPreview';

@Component({
  components: { ClipPreview },
})
export default class Highlighter extends TsxComponent {
  render() {
    return (
      <div>
        {/* <button onClick={this.readNextFrame}>Next Frame</button> */}
        {/* <Clip path={CLIP_1} style={{ margin: '10px' }} />
        <Clip path={CLIP_2} style={{ margin: '10px' }} />
        <Clip path={CLIP_3} style={{ margin: '10px' }} />
        <Clip path={CLIP_4} style={{ margin: '10px' }} /> */}
      </div>
    );
  }
}
