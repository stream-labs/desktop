import React, { ReactNode, useMemo } from 'react';
import { ELayoutElement, IVec2Array } from 'services/layout';
import * as elements from 'components-react/editor/elements';
import * as layouts from 'components-react/editor/layouts';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';

export default function Studio(p: { onTotalWidth: (width: Number) => void }) {
  const { LayoutService } = Services;

  function totalWidthHandler(slots: IVec2Array, isColumns: boolean) {
    if (isColumns) {
      p.onTotalWidth(LayoutService.views.calculateColumnTotal(slots));
    } else {
      p.onTotalWidth(LayoutService.views.calculateMinimum('x', slots));
    }
  }

  const { elementsToRender, slottedElements, layout } = useVuex(() => ({
    elementsToRender: LayoutService.views.elementsToRender,
    slottedElements: LayoutService.views.currentTab.slottedElements,
    layout: LayoutService.views.component,
  }));

  // TODO: index
  // @ts-ignore
  const Layout = layouts[layout];

  const { children, childrenMins } = useMemo(() => {
    const children: Dictionary<ReactNode> = {};
    const childrenMins: Dictionary<IVec2> = {};
    elementsToRender.forEach((el: ELayoutElement) => {
      const componentName = LayoutService.views.elementComponent(el);
      // TODO: index
      // @ts-ignore
      const Component = elements[componentName];
      const slot = slottedElements[el]?.slot;
      if (slot && Component) {
        children[slot] = <Component />;
        childrenMins[slot] = Component.mins;
      }
    });
    return { children, childrenMins };
  }, []);

  return (
    <Layout
      class="editor-page"
      childrenMins={childrenMins}
      onTotalWidth={(slots: IVec2Array, isColumns: boolean) => totalWidthHandler(slots, isColumns)}
    >
      {children}
    </Layout>
  );
}
