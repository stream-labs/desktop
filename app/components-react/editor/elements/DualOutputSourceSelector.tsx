import React, { useEffect, useRef, useState } from 'react';
import { inject, injectState, injectWatch, mutation, useModule } from 'slap';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';

export function DualOutputSourceSelector(x: {
  toggleVisibility: (ev: unknown) => void;
  isVisible: boolean;
}) {
  const { DualOutputService } = Services;

  const v = useVuex(() => ({
    isHorizontalActive: DualOutputService.views.isHorizontalActive,
    isVerticalActive: DualOutputService.views.isVerticalActive,
    toggleHorizontalVisibility: DualOutputService.actions.toggleHorizontalVisibility,
    toggleVerticalVisibility: DualOutputService.actions.toggleVerticalVisibility,
  }));
  return (
    <>
      {/* @@@ HERE TODO: 1. update font and font icons.*/}

      <i
        onClick={() => v.toggleVerticalVisibility(!v.isVerticalActive)}
        className={v.isVerticalActive ? 'icon-phone-case' : 'icon-phone-case-hide'}
      />

      <i
        onClick={() => v.toggleHorizontalVisibility(!v.isHorizontalActive)}
        className={v.isHorizontalActive ? 'icon-desktop' : 'icon-desktop-hide'}
      />
    </>
  );
}
