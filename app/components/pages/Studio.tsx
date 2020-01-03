import TsxComponent from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import {
  Mixer,
  SceneSelector,
  SourceSelector,
  LegacyEvents,
  MiniFeed,
  Display,
} from 'components/editor/elements';
import { LayoutService, ELayoutElement, ELayout, LayoutSlot } from 'services/layout';
import { WindowsService } from 'services/windows';
import * as Layouts from 'components/editor/layouts';
import { IResizeMins } from 'components/editor/layouts/BaseLayout';

const COMPONENT_MAP: Dictionary<typeof TsxComponent> = {
  [ELayoutElement.Display]: Display,
  [ELayoutElement.Minifeed]: MiniFeed,
  [ELayoutElement.LegacyEvents]: LegacyEvents,
  [ELayoutElement.Mixer]: Mixer,
  [ELayoutElement.Scenes]: SceneSelector,
  [ELayoutElement.Sources]: SourceSelector,
};

const LAYOUT_MAP: Dictionary<typeof TsxComponent> = {
  [ELayout.Default]: Layouts.Default,
  [ELayout.TwoPane]: Layouts.TwoPane,
  [ELayout.Classic]: Layouts.Classic,
  [ELayout.OnePane]: Layouts.OnePane,
  [ELayout.Triplets]: Layouts.Triplets,
  [ELayout.FourByFour]: Layouts.FourByFour,
};

@Component({})
export default class Studio extends TsxComponent {
  @Inject() private layoutService: LayoutService;
  @Inject() private windowsService: WindowsService;

  max: number = null;
  elWidth: number = 0;
  interval: number;

  mounted() {
    this.interval = window.setInterval(() => {
      this.elWidth = this.$el.getBoundingClientRect().width;
    }, 500);
    this.max = this.isColumns
      ? this.$el.getBoundingClientRect().width
      : this.$el.getBoundingClientRect().height;
  }

  destroyed() {
    if (this.interval) clearInterval(this.interval);
  }

  get resizes() {
    return this.layoutService.state.resizes;
  }

  get isColumns() {
    return [ELayout.TwoPane, ELayout.Triplets, ELayout.OnePane].includes(
      this.layoutService.state.currentLayout,
    );
  }

  get slottedElements() {
    return this.layoutService.state.slottedElements;
  }

  windowResizeHandler(mins: IResizeMins, isChat?: boolean) {
    if (isChat && !this.isColumns) return;

    const oldMax = this.max;

    // This is the maximum size we can use
    this.max = this.isColumns
      ? this.$el.getBoundingClientRect().width
      : this.$el.getBoundingClientRect().height;

    this.resizeByRatio(oldMax);
    this.reconcileSizeWithinContraints(mins);
  }

  resizeByRatio(oldMax: number) {
    const ratio = this.max / oldMax;

    this.setBarResize('bar1', Math.round(this.resizes.bar1 * ratio));
    if (this.resizes.bar2) {
      this.setBarResize('bar2', Math.round(this.resizes.bar2 * ratio));
    }
  }

  /**
   * Makes sure both resizable elements are reasonable sizes that
   * fit within the window. If together they are larger than the
   * max, then the primary view will be reduced in size until a reasonable
   * minimum, at which point the secondary will start being reduced in size.
   */
  reconcileSizeWithinContraints(mins: IResizeMins) {
    const functionalMax = this.calculateMax(mins.rest);
    if (this.underMaxSize(functionalMax)) return;

    if (this.resizes.bar1 > mins.bar1) {
      const remainingSpace = mins.bar2 ? functionalMax - this.resizes.bar2 : functionalMax;
      this.setBarResize('bar1', Math.max(remainingSpace, mins.bar1));
      if (this.underMaxSize(functionalMax)) return;
    }
    if (!mins.bar2) return;
    if (this.resizes.bar2 > mins.bar2) {
      const oldBar2 = this.resizes.bar2;
      this.setBarResize('bar2', Math.max(functionalMax - mins.bar1, mins.bar2));
      this.setBarResize('bar1', this.resizes.bar1 - (this.resizes.bar2 - oldBar2));
      if (this.underMaxSize(functionalMax)) return;
    }
    // The final strategy is to just split the remaining space
    this.setBarResize('bar1', functionalMax / 2);
    this.setBarResize('bar2', functionalMax / 2);
  }

  calculateMin(slots: (LayoutSlot | LayoutSlot[])[]) {
    return this.layoutService.calculateMinimum(this.isColumns ? 'x' : 'y', slots);
  }

  totalWidthHandler(slots: (LayoutSlot | LayoutSlot[])[]) {
    if (this.isColumns) {
      this.$emit('totalWidth', this.layoutService.calculateColumnTotal(slots));
    } else {
      this.$emit('totalWidth', this.layoutService.calculateMinimum('x', slots));
    }
  }

  calculateMax(restMin: number) {
    return this.max - restMin;
  }

  underMaxSize(max: number) {
    return this.resizes.bar1 + this.resizes.bar2 <= max;
  }

  setBarResize(bar: 'bar1' | 'bar2', size: number, mins?: IResizeMins) {
    this.layoutService.setBarResize(bar, size);
    if (mins) this.reconcileSizeWithinContraints(mins);
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
        calculateMin={(slots: (LayoutSlot)[]) => this.calculateMin(slots)}
        calculateMax={(min: number) => this.calculateMax(min)}
        setBarResize={(bar: 'bar1' | 'bar2', size: number, mins?: IResizeMins) =>
          this.setBarResize(bar, size, mins)
        }
        windowResizeHandler={(mins: IResizeMins, isChat?: boolean) =>
          this.windowResizeHandler(mins)
        }
        resizes={this.resizes}
        class="editor-page"
        elWidth={this.elWidth}
        onTotalWidth={(slots: (LayoutSlot | LayoutSlot[])[]) => this.totalWidthHandler(slots)}
      >
        {Object.keys(this.layoutService.state.slottedElements).map(widget => {
          const Element = COMPONENT_MAP[widget];
          return <Element slot={this.layoutService.state.slottedElements[widget]} />;
        })}
      </Layout>
    );
  }
}
