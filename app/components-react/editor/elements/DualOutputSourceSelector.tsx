import React from 'react';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { useModule } from 'slap';
import { SourceSelectorModule } from './SourceSelector';

// @@@ TODO: Refactor to use a module that extends the Source Selector Module for reactivity
// @@@ TODO: Refactor to expand this component to handle applying changes from updates to sources

export function DualOutputSourceSelector(p: { nodeId: string }) {
  const { toggleVisibility } = useModule(SourceSelectorModule);
  const { DualOutputService, ScenesService } = Services;

  const horizontalNodeId = p.nodeId;

  const v = useVuex(() => ({
    showDualOutputDisplays: DualOutputService.views.dualOutputMode,
    verticalNodeId: DualOutputService.views.getDisplayNodeId(p.nodeId),
    isHorizontalVisible: ScenesService.views.getNodeVisibility(p.nodeId),
    isVerticalVisible: DualOutputService.views.getDisplayNodeVisibility(p.nodeId, 'vertical'),
  }));

  return (
    <>
      {/* @@@ TODO: update font and font icons.*/}

      <i
        onClick={() => toggleVisibility(horizontalNodeId)}
        className={v.isHorizontalVisible ? 'icon-desktop' : 'icon-desktop-hide'}
      />

      <i
        onClick={() => toggleVisibility(v.verticalNodeId)}
        className={v.isVerticalVisible ? 'icon-phone-case' : 'icon-phone-case-hide'}
      />
    </>
  );
}
