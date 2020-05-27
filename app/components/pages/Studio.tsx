import TsxComponent from 'components/tsx-component';
import { Component, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { LayoutService, ELayoutElement, IVec2Array } from 'services/layout';
import { WindowsService } from 'services/windows';
import { IResizeMins } from 'components/editor/layouts/BaseLayout';

@Component({})
export default class Studio extends TsxComponent {
  @Inject() private layoutService: LayoutService;
  @Inject() private windowsService: WindowsService;

  max: number = null;
  elWidth: number = 0;
  interval: number;

  mounted() {
    this.max = this.isColumns
      ? this.$el.getBoundingClientRect().width
      : this.$el.getBoundingClientRect().height;
    this.interval = window.setInterval(() => {
      this.elWidth = this.$el.getBoundingClientRect().width;
    }, 500);
  }

  destroyed() {
    if (this.interval) clearInterval(this.interval);
  }

  get resizes() {
    return this.layoutService.views.currentTab.resizes;
  }

  get isColumns() {
    return this.layoutService.views.isColumnLayout;
  }

  get slottedElements() {
    return this.layoutService.views.currentTab.slottedElements;
  }

  get currentTab() {
    return this.layoutService.views.currentTab;
  }

  @Watch('currentTab')
  syncMax() {
    this.max = this.isColumns
      ? this.$el.getBoundingClientRect().width
      : this.$el.getBoundingClientRect().height;
  }

  windowResizeHandler(mins: IResizeMins, isChat?: boolean) {
    if (isChat && !this.isColumns) return;

    const oldMax = this.max;

    // This is the maximum size we can use
    this.max = this.isColumns
      ? this.$el.getBoundingClientRect().width
      : this.$el.getBoundingClientRect().height;

    if (this.max === 0) {
      this.max = oldMax;
      return;
    }

    this.resizeByRatio(oldMax);
    this.reconcileSizeWithinContraints(mins);
  }

  resizeByRatio(oldMax: number) {
    if (this.max === oldMax || !oldMax || !this.max) return;

    const ratio = this.max / oldMax;
    if (ratio === 0) return;
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

  calculateMin(slots: IVec2Array) {
    return this.layoutService.calculateMinimum(this.isColumns ? 'x' : 'y', slots);
  }

  totalWidthHandler(slots: IVec2Array) {
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
    if (this.resizes.bar2 == null) {
      return this.resizes.bar1 <= max;
    }
    return this.resizes.bar1 + this.resizes.bar2 <= max;
  }

  setBarResize(bar: 'bar1' | 'bar2', size: number, mins?: IResizeMins) {
    this.layoutService.setBarResize(bar, size);
    if (mins) this.reconcileSizeWithinContraints(mins);
  }

  resizeStartHandler() {
    this.windowsService.actions.updateStyleBlockers('main', true);
  }

  resizeStopHandler() {
    this.windowsService.actions.updateStyleBlockers('main', false);
  }

  render() {
    const Layout = this.layoutService.views.component;
    return (
      <Layout
        resizeStartHandler={() => this.resizeStartHandler()}
        resizeStopHandler={() => this.resizeStopHandler()}
        calculateMin={(slots: IVec2[]) => this.calculateMin(slots)}
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
        onTotalWidth={(slots: IVec2Array) => this.totalWidthHandler(slots)}
      >
        {Object.keys(this.layoutService.views.currentTab.slottedElements).map(
          (widget: ELayoutElement) => {
            const Element = this.layoutService.views.elementComponent(widget);
            return (
              <Element slot={this.layoutService.views.currentTab.slottedElements[widget].slot} />
            );
          },
        )}
      </Layout>
    );
  }
}
