import React, { HTMLAttributes } from 'react';

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

interface IScrollableProps {
  className?: string;
  isResizable?: boolean;
  horizontal?: boolean;
  /**
   * Has performance implications. Should only be used where
   * absolutely necessary.
   */
  autoSizeCapable?: boolean;
}

export default function Scrollable(initialProps: IScrollableProps & HTMLAttributes<unknown>) {
  const p = {
    isResizable: true,
    ...initialProps,
  };

  return (
    <OverlayScrollbarsComponent
      options={{
        autoUpdate: true,
        autoUpdateInterval: 200,
        className: p.className,
        resize: p.isResizable ? 'both' : 'none',
        sizeAutoCapable: p.autoSizeCapable,
        scrollbars: { clickScrolling: true },
        overflowBehavior: { x: p.horizontal ? 'scroll' : 'hidden' },
      }}
    >
      {p.children}
    </OverlayScrollbarsComponent>
  );
}
