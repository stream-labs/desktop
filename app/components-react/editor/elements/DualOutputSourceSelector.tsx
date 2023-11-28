import React, { useMemo } from 'react';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { useController } from '../../hooks/zustand';
import { SourceSelectorCtx } from './SourceSelector';

interface IDualOutputSourceSelector {
  nodeId: string;
  sceneId?: string;
}
export function DualOutputSourceSelector(p: IDualOutputSourceSelector) {
  const { toggleVisibility, makeActive, horizontalActive, verticalActive } = useController(
    SourceSelectorCtx,
  );
  const { DualOutputService } = Services;

  const v = useVuex(() => ({
    verticalNodeId:
      DualOutputService.views.verticalNodeIds && horizontalActive
        ? DualOutputService.views.activeSceneNodeMap[p.nodeId]
        : p.nodeId,
    isHorizontalVisible:
      !DualOutputService.views.isLoading &&
      DualOutputService.views.getIsHorizontalVisible(p.nodeId, p?.sceneId),
    isVerticalVisible:
      !DualOutputService.views.isLoading &&
      DualOutputService.views.getIsVerticalVisible(p.nodeId, p?.sceneId),
    isLoading: DualOutputService.views.isLoading && !DualOutputService.views.hasVerticalNodes,
  }));

  const showHorizontalToggle = useMemo(() => {
    return !v.isLoading && horizontalActive;
  }, [!v.isLoading, horizontalActive]);

  const showVerticalToggle = useMemo(() => {
    return !v.isLoading && v?.verticalNodeId && verticalActive;
  }, [!v.isLoading, v?.verticalNodeId, verticalActive]);

  return (
    <>
      {showHorizontalToggle && (
        <i
          onClick={() => {
            toggleVisibility(p.nodeId);
            makeActive(p.nodeId);
          }}
          className={v.isHorizontalVisible ? 'icon-desktop' : 'icon-desktop-hide'}
        />
      )}

      {showVerticalToggle && (
        <i
          onClick={() => {
            toggleVisibility(v.verticalNodeId);
            makeActive(v.verticalNodeId);
          }}
          className={v.isVerticalVisible ? 'icon-phone-case' : 'icon-phone-case-hide'}
        />
      )}
    </>
  );
}
