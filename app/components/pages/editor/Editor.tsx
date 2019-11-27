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

  maxHeight: number = null;

  get resizes() {
    return this.layoutService.state.resizes;
  }

  /**
   * Makes sure both the controls and events heights are reasonable sizes that
   * fit within the window. If controls and events together are larger than the
   * max height, then the events view will be reduced in size until a reasonable
   * minimum, at which point the controls will start being reduced in size.
   */
  reconcileHeightsWithinContraints(mins: IResizeMins, isBar2Resize = false) {
    // This is the maximum height we can use
    this.maxHeight = this.$el.getBoundingClientRect().height;
    // Something needs to be adjusted to fit
    if (this.resizes.bar1 + this.resizes.bar2 + 20 > this.maxHeight) {
      // If we're resizing the controls then we should be more aggressive
      // taking size from events
      const minEventsHeight = isBar2Resize ? mins.bar1.absolute : mins.bar1.reasonable;
      if (this.resizes.bar1 > minEventsHeight) {
        this.setBarResize('bar1', Math.max(this.maxHeight - this.resizes.bar2, minEventsHeight));
        // If we are under max height, we are done
        if (this.resizes.bar2 + this.resizes.bar1 + 20 <= this.maxHeight) return;
      }
      if (this.resizes.bar2 > mins.bar2.reasonable) {
        this.setBarResize(
          'bar2',
          Math.max(this.maxHeight - this.resizes.bar1, mins.bar2.reasonable),
        );
        // If we are under max height, we are done
        if (this.resizes.bar2 + this.resizes.bar1 + 20 <= this.maxHeight) return;
      }
      // The final strategy is to just split the remaining space
      this.setBarResize('bar1', this.maxHeight / 2);
      this.setBarResize('bar2', this.maxHeight / 2);
    }
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
        reconcileHeightsWithinContraints={this.reconcileHeightsWithinContraints.bind(this)}
        setBarResize={this.setBarResize.bind(this)}
        maxHeight={this.maxHeight}
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
