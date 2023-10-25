import { TDisplayType } from 'services/settings-v2';
import { focusChild, click, clickCheckbox, clickButton, clickIfDisplayed } from './core';
import { showSettingsWindow } from './settings/settings';
import { SceneNode } from 'services/api/external-api/scenes';

/**
 * Toggle dual output mode
 */
export async function toggleDualOutputMode(closeChildWindow: boolean = true) {
  await showSettingsWindow('Video', async () => {
    await focusChild();
    await clickCheckbox('dual-output-checkbox');

    if (closeChildWindow) {
      await clickButton('Done');
    }
  });
}

/**
 * Toggle display
 */
export async function toggleDisplay(display: TDisplayType, wait: boolean = false) {
  if (wait) {
    await clickIfDisplayed(`i#${display}-display-toggle`);
  } else {
    await click(`i#${display}-display-toggle`);
  }
}

export function confirmSelectorNodesDisplay(sceneNodes: SceneNode[], display: TDisplayType) {
  return sceneNodes.reduce((hasCorrectDisplay: boolean, node: SceneNode) => {
    if (node?.display !== display) {
      hasCorrectDisplay = false;
    }
    return hasCorrectDisplay;
  }, true);
}

export function confirmHasDisplaysAssigned(sceneNodes: SceneNode[]) {
  return sceneNodes.reduce((hasDisplay: boolean, node: SceneNode) => {
    if (!node?.display) {
      hasDisplay = false;
    }
    return hasDisplay;
  }, true);
}
