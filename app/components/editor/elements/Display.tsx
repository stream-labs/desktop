import StudioEditor from 'components/StudioEditor.vue';
import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';

@Component({})
export default class MiniFeed extends TsxComponent {
  render() {
    return <StudioEditor />;
  }
}
