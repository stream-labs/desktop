import React, { useMemo } from 'react';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { useModule } from 'slap';
import { SourceSelectorModule } from './SourceSelector';
import { Tooltip } from 'antd';
import { $t } from 'services/i18n';

interface IDualOutputSourceSelector {
  nodeId: string;
  sceneId?: string;
}
export function DualOutputSourceSelector(p: IDualOutputSourceSelector) {
  const { toggleVisibility, allSelected } = useModule(SourceSelectorModule);
  const { DualOutputService } = Services;

  const v = useVuex(() => ({
    verticalNodeId:
      DualOutputService.views.verticalNodeIds && DualOutputService.views.activeDisplays.horizontal
        ? DualOutputService.views.activeSceneNodeMap[p.nodeId]
        : p.nodeId,
    isHorizontalVisible: DualOutputService.views.getIsHorizontalVisible(p.nodeId, p?.sceneId),
    isVerticalVisible: DualOutputService.views.getIsVerticalVisible(p.nodeId, p?.sceneId),
    isLoading: DualOutputService.views.isLoading && !DualOutputService.views.hasVerticalNodes,
    horizontalActive: DualOutputService.views.activeDisplays.horizontal,
    verticalActive: DualOutputService.views.activeDisplays.vertical,
  }));

  const showLinkIcon = useMemo(() => {
    return (
      allSelected([p.nodeId, v.verticalNodeId]) && v?.isHorizontalVisible && v?.isVerticalVisible
    );
  }, [allSelected, p.nodeId, v.verticalNodeId, v?.isHorizontalVisible, v?.isVerticalVisible]);

  const showHorizontalToggle = useMemo(() => {
    return !v?.isLoading && v.horizontalActive;
  }, [!v?.isLoading, v.horizontalActive]);

  const showVerticalToggle = useMemo(() => {
    return !v?.isLoading && v?.verticalNodeId && v.verticalActive;
  }, [!v?.isLoading, v?.verticalNodeId, v.verticalActive]);

  return (
    <>
      {showLinkIcon && (
        <Tooltip
          title={$t(
            'You currently have the same source on both canvases selected. Please select the source in the canvas to edit it independently.',
          )}
          placement="bottomRight"
        >
          <i className="icon-link" style={{ color: 'var(--teal)' }} />
        </Tooltip>
      )}
      {showHorizontalToggle && (
        <i
          onClick={() => toggleVisibility(p.nodeId)}
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
