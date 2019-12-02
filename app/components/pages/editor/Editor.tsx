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
import { IResizeMins } from './layouts/Default';

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
export default class Editor extends Vue {
  @Inject() private layoutService: LayoutService;
  @Inject() private windowsService: WindowsService;

  max: number = null;

  get resizes() {
    return this.layoutService.state.resizes;
  }

  /**
   * Makes sure both resizable elements are reasonable sizes that
   * fit within the window. If together they are larger than the
   * max, then the primary view will be reduced in size until a reasonable
   * minimum, at which point the secondary will start being reduced in size.
   */
  reconcileSizeWithinContraints(mins: IResizeMins, isBar2Resize = false) {
    // This is the maximum size we can use
    this.max = this.$el.getBoundingClientRect().height;
    if (this.underMaxSize) return;
    // If we're resizing the controls then we should be more aggressive
    // taking size from events
    const minBar1Size = isBar2Resize ? mins.bar1.absolute : mins.bar1.reasonable;
    if (this.resizes.bar1 > minBar1Size) {
      this.setBarResize('bar1', Math.max(this.max - this.resizes.bar2, minBar1Size));
      if (this.underMaxSize) return;
    }
    if (this.resizes.bar2 > mins.bar2.reasonable) {
      this.setBarResize('bar2', Math.max(this.max - this.resizes.bar1, mins.bar2.reasonable));
      if (this.underMaxSize) return;
    }
    // The final strategy is to just split the remaining space
    this.setBarResize('bar1', this.max / 2);
    this.setBarResize('bar2', this.max / 2);
  }

  get underMaxSize() {
    return this.resizes.bar1 + this.resizes.bar2 + 20 <= this.max;
  }

  setBarResize(bar: 'bar1' | 'bar2', size: number) {
    this.layoutService.setBarResize(bar, size);
  }

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
        reconcileSizeWithinContraints={this.reconcileSizeWithinContraints.bind(this)}
        setBarResize={this.setBarResize.bind(this)}
        max={this.max}
        resizes={this.resizes}
      >
        {Object.keys(this.layoutService.state.slottedWidgets).map(widget => {
          const Element = COMPONENT_MAP[widget];
          return <Element slot={this.layoutService.state.slottedWidgets[widget]} />;
        })}
      </Layout>
    );
  }
}
