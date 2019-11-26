import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import StudioEditor from 'components/StudioEditor.vue';
import { Inject } from 'services/core/injector';
import RecentEvents from 'components/RecentEvents';
import SceneSelector from 'components/SceneSelector.vue';
import SourceSelector from 'components/SourceSelector.vue';
import Mixer from 'components/Mixer.vue';
import { LayoutService, ELayoutElement, ELayout } from 'services/layout';
import { WindowsService } from 'services/windows';
import * as Layouts from './layouts';

const COMPONENT_MAP = {
  [ELayoutElement.Display]: StudioEditor,
  [ELayoutElement.Minifeed]: RecentEvents,
  [ELayoutElement.Mixer]: Mixer,
  [ELayoutElement.Scenes]: SceneSelector,
  [ELayoutElement.Sources]: SourceSelector,
};

const LAYOUT_MAP = {
  [ELayout.Default]: Layouts.Default,
};

@Component({})
export default class Studio extends Vue {
  @Inject() private layoutService: LayoutService;
  @Inject() private windowsService: WindowsService;

  resizeStartHandler() {
    this.windowsService.updateStyleBlockers('main', true);
  }

  resizeStopHandler() {
    this.windowsService.updateStyleBlockers('main', false);
  }

  render() {
    const Layout = LAYOUT_MAP[this.layoutService.state.currentLayout];
    return (
      <Layout
        resizeStartHandler={() => this.resizeStartHandler()}
        resizeStopHandler={() => this.resizeStopHandler()}
        resizes={this.layoutService.state.resizes}
      >
        {Object.keys(this.layoutService.state.slottedWidgets).map(widget => {
          const Element = COMPONENT_MAP[widget];
          return <Element slot={this.layoutService.state.slottedWidgets[widget]} />;
        })}
      </Layout>
    );
  }
}
