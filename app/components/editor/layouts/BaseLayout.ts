import TsxComponent from 'components/tsx-component';
import { Watch } from 'vue-property-decorator';
import { LayoutSlot, LayoutService, IVec2Array } from 'services/layout';
import BaseElement from 'components/editor/elements/BaseElement';
import { Inject } from 'services/core';
import { CustomizationService } from 'services/customization';
import { WindowsService } from 'services/windows';

export class LayoutProps {
  onTotalWidth: (slots: IVec2Array, isColumns: boolean) => void = () => {};
}

export interface IResizeMins {
  rest: number;
  bar1: number;
  bar2?: number;
}

export interface ILayoutSlotArray extends Array<ILayoutSlotArray | LayoutSlot> {}

export default class BaseLayout extends TsxComponent<LayoutProps> {
  @Inject() private layoutService: LayoutService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private windowsService: WindowsService;

  mins: IResizeMins = { rest: null, bar1: null };
  isColumns: boolean;
  firstRender: boolean;
  bar1: number = 0;
  bar2: number = 0;

  async mountResize() {
    this.$emit('totalWidth', await this.mapVectors(this.vectors), this.isColumns);
    window.addEventListener('resize', () => this.updateSize());
    await this.updateSize();
  }

  destroyResize() {
    window.removeEventListener('resize', () => this.updateSize());
  }

  get vectors(): ILayoutSlotArray {
    return null;
  }

  get chatCollapsed() {
    return this.customizationService.state.livedockCollapsed;
  }

  async setMins(
    restSlots: ILayoutSlotArray,
    bar1Slots: ILayoutSlotArray,
    bar2Slots?: ILayoutSlotArray,
  ) {
    const rest = await this.calculateMinimum(restSlots);
    const bar1 = await this.calculateMinimum(bar1Slots);
    const bar2 = await this.calculateMinimum(bar2Slots);
    this.mins = { rest, bar1, bar2 };
  }

  get resizes() {
    return this.layoutService.views.currentTab.resizes;
  }

  async getBarPixels(bar: 'bar1' | 'bar2', offset: number) {
    // Before we can access the clientRect at least one render cycle needs to run
    if (!this.firstRender) await this.$nextTick();
    this.firstRender = true;
    // Migrate from pixels to proportions
    if (this.resizes[bar] >= 1) await this.setBar(bar, this.resizes[bar]);
    const { height, width } = this.$el.getBoundingClientRect();
    const offsetSize = this.isColumns ? width - offset : height;
    return Math.round(offsetSize * this.resizes[bar]);
  }

  async setBar(bar: 'bar1' | 'bar2', val: number) {
    if (val === 0) return;
    if (!this.firstRender) await this.$nextTick();
    this.firstRender = true;
    this[bar] = val;
    const { height, width } = this.$el.getBoundingClientRect();
    const totalSize = this.isColumns ? width : height;
    const proportion = parseFloat((val / totalSize).toFixed(2));
    await this.layoutService.actions.return.setBarResize(bar, proportion);
  }

  async minsFromSlot(slot: LayoutSlot) {
    // Before we can access the componentInstance at least one render cycle needs to run
    if (!this.firstRender) await this.$nextTick();
    this.firstRender = true;
    // If there is no component slotted we return no minimum
    if (!this.$slots[slot]) return { x: 0, y: 0 };
    return (this.$slots[slot][0].componentInstance as BaseElement).mins;
  }

  async calculateMinimum(slots: ILayoutSlotArray) {
    if (!slots) return;
    const mins = await this.mapVectors(slots);
    return this.calculateMin(mins);
  }

  async mapVectors(slots: ILayoutSlotArray): Promise<IVec2Array> {
    return Promise.all(
      slots.map(async slot => {
        if (Array.isArray(slot)) return this.mapVectors(slot);
        return this.minsFromSlot(slot);
      }),
    );
  }

  calculateMin(slots: IVec2Array) {
    return this.layoutService.views.calculateMinimum(this.isColumns ? 'x' : 'y', slots);
  }

  resizeStartHandler() {
    this.windowsService.actions.updateStyleBlockers('main', true);
  }

  resizeStopHandler() {
    this.windowsService.actions.updateStyleBlockers('main', false);
  }

  calculateMax(restMin: number) {
    if (!this.$el) return;
    const { height, width } = this.$el.getBoundingClientRect();
    const max = this.isColumns ? width : height;
    return max - restMin;
  }

  @Watch('chatCollapsed')
  async updateSize(chatCollapsed = true, oldChatCollapsed?: boolean) {
    let offset = chatCollapsed ? 0 : this.customizationService.state.livedockSize;
    // Reverse offset if chat is collapsed from an uncollapsed state
    if (chatCollapsed && oldChatCollapsed === false) {
      offset = this.customizationService.state.livedockSize * -1;
    }
    this.bar1 = await this.getBarPixels('bar1', offset);
    this.bar2 = await this.getBarPixels('bar2', offset);
  }
}
