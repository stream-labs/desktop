import { Inject } from '../../services/service';
import { SourceTransformMenu } from './SourceTransformMenu';
import { ScenesService } from '../../services/scenes';
import { SourceMenu } from './SourceMenu';

export class SceneItemMenu extends SourceMenu {

  @Inject()
  private scenesService: ScenesService;

  private sceneItem = this.scenesService.getScene(this.sceneId).getItem(this.sceneItemId);

  constructor(private sceneId: string, private sceneItemId: string, sourceId: string) {
    super(sourceId);
    this.appendSceneItemsMenuItems();
  }


  private appendSceneItemsMenuItems() {

    this.append({
      label: 'Transform',
      submenu: this.transformSubmenu().menu
    });

    const visibilityLabel = this.sceneItem.visible ? 'Hide' : 'Show';

    this.append({
      label: visibilityLabel,
      click: () => {
        this.sceneItem.setVisibility(!this.sceneItem.visible);
      }
    });

  }

  transformSubmenu() {
    return new SourceTransformMenu(this.sceneId, this.sceneItemId);
  }

}
