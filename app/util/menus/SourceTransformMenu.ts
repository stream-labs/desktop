import { Menu } from './Menu';
import { ScenesService } from 'services/scenes';
import { VideoService } from 'services/video';
import { SelectionService } from 'services/selection';
import { Inject } from '../../util/injector';

export class SourceTransformMenu extends Menu {

  @Inject() private scenesService: ScenesService;
  @Inject() private videoService: VideoService;
  @Inject() private selectionService: SelectionService;

  constructor() {
    super();

    this.appendMenuItems();
  }


  appendMenuItems() {
    this.append({
      label: 'Reset Transform',
      click: () => {
        this.selectionService.resetTransform();
      }
    });

    this.append({
      label: 'Flip Vertical',
      click: () => {
        this.selectionService.flipY();
      }
    });

    this.append({
      label: 'Flip Horizontal',
      click: () => {
        this.selectionService.flipX();
      }
    });

    this.append({
      label: 'Stretch to Screen',
      click: () => {
        this.selectionService.stretchToScreen();
      }
    });

    this.append({
      label: 'Fit to Screen',
      click: () => {
        this.selectionService.fitToScreen();
      }
    });

    this.append({
      label: 'Center on Screen',
      click: () => {
        this.selectionService.centerOnScreen();
      }
    });

    this.append({
      label: 'Rotate 90 degrees CW',
      click: () => {
        this.selectionService.rotate(90);
      }
    });

    this.append({
      label: 'Rotate 90 degrees CCW',
      click: () => {
        this.selectionService.rotate(-90);
      }
    });

    this.append({
      label: 'Rotate 180 degrees',
      click: () => {
        this.selectionService.rotate(180);
      }
    });
  }

}
