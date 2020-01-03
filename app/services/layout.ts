import isEqual from 'lodash/isEqual';
import { Inject } from 'services/core';
import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { mutation } from 'services/core/stateful-service';
import { CustomizationService } from './customization';

export enum ELayout {
  Default = 'Default',
  TwoPane = 'TwoPane',
  Classic = 'Classic',
  FourByFour = 'FourByFour',
  Triplets = 'Triplets',
  OnePane = 'OnePane',
}

export enum ELayoutElement {
  Minifeed = 'Minifeed',
  LegacyEvents = 'LegacyEvents',
  Display = 'Display',
  Mixer = 'Mixer',
  Scenes = 'Scenes',
  Sources = 'Sources',
}

export type LayoutSlot = '1' | '2' | '3' | '4' | '5' | '6';

interface ILayoutServiceState {
  currentLayout: ELayout;
  slottedElements: { [value in ELayoutElement]?: LayoutSlot };
  resizes: { bar1: number; bar2?: number };
}

const RESIZE_DEFAULTS = {
  [ELayout.Default]: { bar1: 156, bar2: 240 },
  [ELayout.TwoPane]: { bar1: 650, bar2: 300 },
  [ELayout.Classic]: { bar1: 450 },
  [ELayout.FourByFour]: { bar1: 170, bar2: 170 },
  [ELayout.Triplets]: { bar1: 650, bar2: 300 },
  [ELayout.OnePane]: { bar1: 500 },
};

const ELEMENT_MINS = {
  [ELayoutElement.Display]: { x: 350, y: 250 },
  [ELayoutElement.LegacyEvents]: { x: 430, y: 150 },
  [ELayoutElement.Mixer]: { x: 230, y: 150 },
  [ELayoutElement.Minifeed]: { x: 330, y: 150 },
  [ELayoutElement.Sources]: { x: 220, y: 150 },
  [ELayoutElement.Scenes]: { x: 200, y: 150 },
};

export class LayoutService extends PersistentStatefulService<ILayoutServiceState> {
  static defaultState: ILayoutServiceState = {
    currentLayout: ELayout.Default,
    slottedElements: {
      [ELayoutElement.Display]: '1',
      [ELayoutElement.Minifeed]: '2',
      [ELayoutElement.Scenes]: '3',
      [ELayoutElement.Sources]: '4',
      [ELayoutElement.Mixer]: '5',
    },
    resizes: {
      bar1: 156,
      bar2: 240,
    },
  };

  @Inject() private customizationService: CustomizationService;

  init() {
    super.init();

    if (
      this.customizationService.state.legacyEvents &&
      isEqual(this.state, LayoutService.defaultState)
    ) {
      this.setSlots({
        [ELayoutElement.Display]: '1',
        [ELayoutElement.LegacyEvents]: '2',
        [ELayoutElement.Scenes]: '3',
        [ELayoutElement.Sources]: '4',
        [ELayoutElement.Mixer]: '5',
      });
      this.customizationService.setSettings({ legacyEvents: false });
    }
  }

  setBarResize(bar: 'bar1' | 'bar2', size: number) {
    this.SET_RESIZE(bar, size);
  }

  changeLayout(layout: ELayout) {
    this.CHANGE_LAYOUT(layout);
  }

  setSlots(slottedElements: { [key in ELayoutElement]?: LayoutSlot }) {
    this.SET_SLOTS(slottedElements);
  }

  calculateColumnTotal(slots: (LayoutSlot | LayoutSlot[])[]) {
    let totalWidth = 0;
    slots.forEach(slot => {
      if (Array.isArray(slot)) {
        totalWidth += this.calculateMinimum('x', slot);
      } else {
        const c = Object.keys(this.state.slottedElements).find(
          comp => this.state.slottedElements[comp] === slot,
        );
        if (c) totalWidth += ELEMENT_MINS[c].x;
      }
    });

    return totalWidth;
  }

  calculateMinimum(orientation: 'x' | 'y', slots: (LayoutSlot | LayoutSlot[])[]) {
    const aggregateMins: number[] = [];
    const components: ELayoutElement[] = [];
    slots.forEach(slot => {
      if (Array.isArray(slot)) {
        aggregateMins.push(this.aggregateMinimum(orientation, slot));
      } else {
        const c = Object.keys(this.state.slottedElements).find(
          comp => this.state.slottedElements[comp] === slot,
        );
        if (c) components.push(ELayoutElement[c]);
      }
    });
    const minimums = components.map(comp => ELEMENT_MINS[comp][orientation]);
    if (!minimums.length) minimums.push(10);
    return Math.max(...minimums, ...aggregateMins);
  }

  aggregateMinimum(orientation: 'x' | 'y', slots: LayoutSlot[]) {
    const components = slots.map(slot =>
      Object.keys(this.state.slottedElements).find(
        comp => this.state.slottedElements[comp] === slot,
      ),
    );
    const minimums = components.map(comp => ELEMENT_MINS[comp][orientation]);
    if (!minimums.length) minimums.push(10);
    return minimums.reduce((a: number, b: number) => a + b);
  }

  @mutation()
  CHANGE_LAYOUT(layout: ELayout) {
    this.state.currentLayout = layout;
    this.state.slottedElements = {};
    this.state.resizes = RESIZE_DEFAULTS[layout];
  }

  @mutation()
  SET_SLOTS(slottedElements: { [key in ELayoutElement]?: LayoutSlot }) {
    this.state.slottedElements = slottedElements;
  }

  @mutation()
  SET_RESIZE(bar: 'bar1' | 'bar2', size: number) {
    this.state.resizes[bar] = size;
  }
}
