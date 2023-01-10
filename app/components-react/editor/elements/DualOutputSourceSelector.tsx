import React, { useMemo } from 'react';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';

// @@@ TODO: Refactor to use a module that extends the Source Selector Module for reactivity
// @@@ TODO: Refactor to expand this component to handle applying changes from updates to sources

export function DualOutputSourceSelector(p: { nodeId: string }) {
  const { DualOutputService, ScenesService, EditorCommandsService } = Services;

  const v = useVuex(() => ({
    horizontalSceneId: DualOutputService.views.horizontalSceneId,
    verticalSceneId: DualOutputService.views.verticalSceneId,
    horizontalScene: DualOutputService.views.horizontalScene,
    verticalScene: DualOutputService.views.verticalScene,
    horizontalNodeId: DualOutputService.views.getHorizontalNodeId(p.nodeId),
    verticalNodeId: DualOutputService.views.getVerticalNodeId(p.nodeId),
    isHorizontalVisible: ScenesService.views.getNodeVisibility(
      DualOutputService.views.horizontalSceneId,
    ),
    isVerticalVisible: ScenesService.views.getNodeVisibility(
      DualOutputService.views.verticalSceneId,
    ),
    getSceneNode: ScenesService.views.getSceneNode,
  }));

  function toggleVisibility(sceneId: string, sceneNodeId: string) {
    const selection = ScenesService.views.getScene(sceneId)?.getSelection(sceneNodeId);
    const visible = !selection?.isVisible();

    if (selection) {
      EditorCommandsService.actions.executeCommand('HideItemsCommand', selection, !visible);
    }
  }

  return (
    <>
      {/* @@@ TODO: update font and font icons.*/}

      <i
        onClick={() => {
          toggleVisibility(v.horizontalSceneId, v.horizontalNodeId);
        }}
        className={v.isVerticalVisible ? 'icon-phone-case' : 'icon-phone-case-hide'}
      />

      <i
        onClick={() => {
          toggleVisibility(v.verticalSceneId, v.verticalNodeId);
        }}
        className={v.isHorizontalVisible ? 'icon-desktop' : 'icon-desktop-hide'}
      />
    </>
  );
}
