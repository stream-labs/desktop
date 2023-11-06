import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { LayoutSlot, IVec2Array } from 'services/layout';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';

export class LayoutProps {
  onTotalWidth: (slots: IVec2Array, isColumns: boolean) => void = () => {};
  childrenMins: Dictionary<IVec2>;
}

export interface IResizeMins {
  rest: number | null;
  bar1: number | null;
  bar2: number | null;
}

export interface ILayoutSlotArray extends Array<ILayoutSlotArray | LayoutSlot> {}

export default function useLayout(
  vectors: ILayoutSlotArray,
  isColumns: boolean,
  childrenMins: Dictionary<IVec2>,
  onTotalWidth: (slots: IVec2Array, isColumns: boolean) => void = () => {},
) {
  const { CustomizationService, LayoutService, WindowsService } = Services;

  const { livedockSize, resizes, chatCollapsed } = useVuex(() => ({
    livedockSize: CustomizationService.state.livedockSize,
    resizes: LayoutService.views.currentTab.resizes,
    chatCollapsed: CustomizationService.state.livedockCollapsed,
  }));

  const [bars, setBars] = useState<{ bar1: number; bar2: number }>({
    bar1: 0,
    bar2: 0,
  });

  const mins = useMemo(() => {
    const [restSlots, bar1Slots, bar2Slots] = vectorsToSlots();
    const rest = calculateMinimum(restSlots);
    const bar1 = calculateMinimum(bar1Slots);
    let bar2 = 0;
    if (bar2Slots) bar2 = calculateMinimum(bar2Slots);
    return { rest, bar1, bar2 };
  }, []);

  useEffect(() => {
    onTotalWidth(mapVectors(vectors), isColumns);
    updateSize();
    window.addEventListener('resize', () => updateSize());

    return () => {
      window.removeEventListener('resize', () => updateSize());
    };
  }, [chatCollapsed]);

  const componentEl = useRef<HTMLDivElement | null>(null);

  const componentRef = useCallback(node => {
    if (node) {
      componentEl.current = node;
      onTotalWidth(mapVectors(vectors), isColumns);
      updateSize();
    }
  }, []);

  function vectorsToSlots() {
    const slotArray: Array<ILayoutSlotArray> = [];
    vectors.forEach(vector => {
      if (typeof vector === 'string') slotArray.push([vector]);
      else if (Array.isArray(vector)) slotArray.push(vector);
    });
    return slotArray;
  }

  function getBarPixels(bar: 'bar1' | 'bar2', offset: number) {
    if (!componentEl.current) return;
    // Migrate from pixels to proportions
    if ((resizes[bar] as number) >= 1) setBar(bar, resizes[bar] as number);
    const { height, width } = componentEl.current.getBoundingClientRect();
    const offsetSize = isColumns ? width - offset : height;
    return Math.round(offsetSize * (resizes[bar] as number));
  }

  function setBar(bar: 'bar1' | 'bar2', val: number) {
    if (val === 0 || !componentEl.current) return;
    setBars({ ...bars, [bar]: val });
    const { height, width } = componentEl.current.getBoundingClientRect();
    const totalSize = isColumns ? width : height;
    const proportion = parseFloat((val / totalSize).toFixed(2));
    LayoutService.actions.setBarResize(bar, proportion);
  }

  function minsFromSlot(slot: LayoutSlot) {
    // If there is no component slotted we return no minimum
    if (!childrenMins || !childrenMins[slot]) return { x: 0, y: 0 };
    return childrenMins[slot];
  }

  function calculateMinimum(slots: ILayoutSlotArray) {
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
    if (bar1) setBar('bar1', bar1);
    if (mins.bar2) {
      const bar2 = getBarPixels('bar2', offset);
      if (bar2) setBar('bar2', bar2);
    }
  }

  function calculateMax(restMin: number) {
    if (!componentEl.current) return 0;
    const { height, width } = componentEl.current.getBoundingClientRect();
    const max = isColumns ? width : height;
    return max - restMin;
  }

  return { componentRef, calculateMax, setBar, mins, bars, resizes };
}
