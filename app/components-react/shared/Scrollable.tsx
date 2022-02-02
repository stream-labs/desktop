import React, { HTMLAttributes, useState, CSSProperties } from 'react';

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { OverflowBehavior } from 'overlayscrollbars';

interface IScrollableProps {
  className?: string;
  isResizable?: boolean;
  horizontal?: boolean;
  /**
   * Has performance implications. Should only be used where
   * absolutely necessary.
   */
  autoSizeCapable?: boolean;
  /**
   * snap the scrollbar to the window's edge
   */
  snapToWindowEdge?: boolean;
  /**
   * Pass inline styles
   */
  style?: React.CSSProperties;
}

export default function Scrollable(initialProps: IScrollableProps & HTMLAttributes<unknown>) {
  const p = {
    snapToWindowEdge: false,
    isResizable: true,
    ...initialProps,
  };

  const [wrapperStyles, setWrapperStyles] = useState<CSSProperties>({});

  function onOverflowChanged(ev?: { yScrollable: boolean }) {
    if (!ev) return;
    if (p.snapToWindowEdge && ev.yScrollable) {
      // 24 is a default padding for ant-modal
      setWrapperStyles({ marginRight: '-24px', paddingRight: '24px' });
    } else {
      setWrapperStyles({});
    }
  }

  return (
    <OverlayScrollbarsComponent
      style={{ ...p.style, ...wrapperStyles, ...(p.style ?? {}) }}
      options={{
        autoUpdate: true,
        autoUpdateInterval: 200,
        className: p.className,
        sizeAutoCapable: p.autoSizeCapable,
        scrollbars: { clickScrolling: true },
        overflowBehavior: { x: (p.horizontal ? 'scroll' : 'hidden') as OverflowBehavior },
        callbacks: {
          onOverflowChanged,
        },
      }}
    >
      {p.children}
    </OverlayScrollbarsComponent>
  );
}
