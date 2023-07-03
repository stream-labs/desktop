import React from 'react';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { useModule } from 'slap';
import { SourceSelectorModule } from './SourceSelector';
import cx from 'classnames';

interface IDualOutputSourceSelector {
  nodeId: string;
  sceneId?: string;
}
export function DualOutputSourceSelector(p: IDualOutputSourceSelector) {
  const { toggleVisibility } = useModule(SourceSelectorModule);
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

  return (
    <>
      {!v?.isLoading && v.horizontalActive && (
        <i
          onClick={() => toggleVisibility(p.nodeId)}
          className={cx(
            v.isHorizontalVisible ? 'icon-desktop' : 'icon-desktop-hide',
            'horizontal-item',
          )}
        />
      )}

      {!v?.isLoading && v?.verticalNodeId && v.verticalActive && (
        <i
          onClick={() => toggleVisibility(v.verticalNodeId)}
          className={cx(
            v.isVerticalVisible ? 'icon-phone-case' : 'icon-phone-case-hide',
            'vertical-item',
          )}
        />
      )}
    </>
  );
}
