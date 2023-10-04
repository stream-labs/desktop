import React, { ReactChild, useEffect, useMemo, useState } from 'react';
import { LayoutSlot, IVec2Array } from 'services/layout';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';

export class LayoutProps {
  onTotalWidth: (slots: IVec2Array, isColumns: boolean) => void = () => {};
}

export interface IResizeMins {
  rest: number | null;
  bar1: number | null;
  bar2: number | null;
}

export interface ILayoutSlotArray extends Array<ILayoutSlotArray | LayoutSlot> {}

export default function useLayout(
  component: HTMLElement,
  vectors: ILayoutSlotArray,
  isColumns: boolean,
  children: React.ReactNode,
  onTotalWidth: (slots: IVec2Array, isColumns: boolean) => void = () => {},
) {
  const { CustomizationService, LayoutService, WindowsService } = Services;

  const { livedockSize, resizes, chatCollapsed } = useVuex(() => ({
    livedockSize: CustomizationService.state.livedockSize,
    resizes: LayoutService.views.currentTab.resizes,
    chatCollapsed: CustomizationService.state.livedockCollapsed,
  }));

  const [bars, setBars] = useState<{ bar1: number | null; bar2: number | null }>({
    bar1: null,
    bar2: null,
  });

  const [resizing, setResizing] = useState(false);

  const mins = useMemo(() => {
    const [restSlots, bar1Slots, bar2Slots] = vectorsToSlots();
    const rest = calculateMinimum(restSlots);
    const bar1 = calculateMinimum(bar1Slots);
    const bar2 = calculateMinimum(bar2Slots);
    return { rest, bar1, bar2 };
  }, []);

  useEffect(() => {
    if (!component) return;
    onTotalWidth(mapVectors(vectors), isColumns);

    window.addEventListener('resize', () => updateSize());
    updateSize();
    return () => {
      window.removeEventListener('resize', () => updateSize());
    };
  }, [component, chatCollapsed]);

  useEffect(() => {
    if (resizing) {
      WindowsService.actions.updateStyleBlockers('main', true);
    } else {
      WindowsService.actions.updateStyleBlockers('main', false);
    }
  }, [resizing]);

  function vectorsToSlots() {
    const slotArray: Array<ILayoutSlotArray> = [];
    vectors.forEach(vector => {
      if (typeof vector === 'string') slotArray.push([vector]);
      else if (Array.isArray(vector)) slotArray.push(vector);
    });
    return slotArray;
  }

  function getBarPixels(bar: 'bar1' | 'bar2', offset: number) {
    // Migrate from pixels to proportions
    if ((resizes[bar] as number) >= 1) setBar(bar, resizes[bar] as number);
    const { height, width } = component.getBoundingClientRect();
    const offsetSize = isColumns ? width - offset : height;
    return Math.round(offsetSize * (resizes[bar] as number));
  }

  function setBar(bar: 'bar1' | 'bar2', val: number) {
    if (val === 0) return;
    setBars({ ...bars, [bar]: val });
    const { height, width } = component.getBoundingClientRect();
    const totalSize = isColumns ? width : height;
    const proportion = parseFloat((val / totalSize).toFixed(2));
    LayoutService.actions.setBarResize(bar, proportion);
  }

  function minsFromSlot(slot: LayoutSlot) {
    // If there is no component slotted we return no minimum
    if (!children || !children[slot]) return { x: 0, y: 0 };
    return children[slot].mins;
  }

  function calculateMinimum(slots?: ILayoutSlotArray) {
    if (!slots) return;
    const mins = mapVectors(slots);
    return calculateMin(mins);
  }

  function mapVectors(slots: ILayoutSlotArray): IVec2Array {
    return slots.map(slot => {
      if (Array.isArray(slot)) return mapVectors(slot);
      return minsFromSlot(slot);
    });
  }

  function calculateMin(slots: IVec2Array) {
    return LayoutService.views.calculateMinimum(isColumns ? 'x' : 'y', slots);
  }

  function updateSize(chatCollapsed = true, oldChatCollapsed?: boolean) {
    let offset = chatCollapsed ? 0 : livedockSize;
    // Reverse offset if chat is collapsed from an uncollapsed state
    if (chatCollapsed && oldChatCollapsed === false) {
      offset = livedockSize * -1;
    }
    const bar1 = getBarPixels('bar1', offset);
    const bar2 = getBarPixels('bar2', offset);
    setBars({ bar1, bar2 });
  }

  function calculateMax(restMin: number) {
    if (!component) return 0;
    const { height, width } = component.getBoundingClientRect();
    const max = isColumns ? width : height;
    return max - restMin;
  }

  return { setResizing, calculateMax, setBar, mins, bars, resizes };
}
