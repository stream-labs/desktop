import React, { useMemo } from 'react';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { useModule } from 'slap';
import { SourceSelectorModule } from './SourceSelector';

interface IDualOutputSourceSelector {
  nodeId: string;
  isGameCapture: boolean;
  isAutoGameCapture: boolean;
  sceneId?: string;
}
export function DualOutputSourceSelector(p: IDualOutputSourceSelector) {
  const { toggleVisibility } = useModule(SourceSelectorModule);
  const { DualOutputService, ScenesService } = Services;

  const horizontalNodeId = p.nodeId;

  const v = useVuex(() => ({
    verticalNodeId: DualOutputService.views.verticalNodeIds
      ? DualOutputService.views.activeSceneNodeMap[p.nodeId]
      : undefined,
    isHorizontalVisible:
      !DualOutputService.views.isLoading && DualOutputService.views.hasVerticalNodes
        ? ScenesService.views.getNodeVisibility(p.nodeId, p?.sceneId)
        : undefined,
    isVerticalVisible:
      !DualOutputService.views.isLoading && DualOutputService.views.hasVerticalNodes
        ? ScenesService.views.getNodeVisibility(
            DualOutputService.views.activeSceneNodeMap[p.nodeId],
            p?.sceneId,
          )
        : undefined,
    isLoading: DualOutputService.views.isLoading && !DualOutputService.views.hasVerticalNodes,
    isDualOutputMode: DualOutputService.views.dualOutputMode,
  }));

  const showVerticalToggle = useMemo(() => {
    // show/hide the vertical node for auto game capture
    if (v.isDualOutputMode && p.isAutoGameCapture) {
      // hide the vertical scene item
      toggleVisibility(v.verticalNodeId, false);
    } else if (v.isDualOutputMode && p.isGameCapture && !p.isAutoGameCapture) {
      // match the vertical scene item to the horizontal scene item visibility
      toggleVisibility(v.verticalNodeId, v?.isHorizontalVisible);
    }

    return !p.isAutoGameCapture && !v?.isLoading && v?.verticalNodeId;
  }, [
    p.isAutoGameCapture,
    v.isDualOutputMode,
    v.isLoading,
    v?.verticalNodeId,
    v?.isHorizontalVisible,
  ]);

  return (
    <>
      {!v?.isLoading && (
        <i
          onClick={() => toggleVisibility(horizontalNodeId)}
          className={v.isHorizontalVisible ? 'icon-desktop' : 'icon-desktop-hide'}
        />
      )}

      {showVerticalToggle && (
        <i
          onClick={() => toggleVisibility(v.verticalNodeId)}
          className={v.isVerticalVisible ? 'icon-phone-case' : 'icon-phone-case-hide'}
        />
      )}
    </>
  );
}
