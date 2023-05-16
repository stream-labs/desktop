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
    hasVerticalNodes: DualOutputService.views.hasVerticalNodes,
    verticalNodeId: DualOutputService.views.verticalNodeIds
      ? DualOutputService.views.activeSceneNodeMap[p.nodeId]
      : undefined,
    isHorizontalVisible: ScenesService.views.getNodeVisibility(p.nodeId),
    isVerticalVisible: DualOutputService.views.hasVerticalNodes
      ? ScenesService.views.getNodeVisibility(DualOutputService.views.activeSceneNodeMap[p.nodeId])
      : undefined,
    isLoading: DualOutputService.views.isLoading,
  }));

  return (
    <>
      <i
        onClick={() => toggleVisibility(horizontalNodeId)}
        className={v.isHorizontalVisible ? 'icon-desktop' : 'icon-desktop-hide'}
      />

      {!v?.isLoading && v?.verticalNodeId && (
        <i
          onClick={() => toggleVisibility(v.verticalNodeId)}
          className={v.isVerticalVisible ? 'icon-phone-case' : 'icon-phone-case-hide'}
        />
      )}
    </>
  );
}
