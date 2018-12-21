import { Menu } from './Menu';
import { ScenesService } from 'services/scenes';
import { VideoService } from 'services/video';
import { SelectionService } from 'services/selection';
import { Inject } from '../injector';
import { $t } from 'services/i18n';

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
      label: $t('Reset Transform'),
      click: () => {
        this.selectionService.resetTransform();
      },
    });

    this.append({ type: 'separator' });

    this.append({
      label: $t('Stretch to Screen'),
      click: () => {
        this.selectionService.stretchToScreen();
      },
    });

    this.append({
      label: $t('Fit to Screen'),
      click: () => {
        this.selectionService.fitToScreen();
      },
    });

    this.append({ type: 'separator' });

    this.append({
      label: $t('Center on Screen'),
      click: () => {
        this.selectionService.centerOnScreen();
      },
    });

    this.append({
      label: $t('Center Horizontal'),
      click: () => {
        this.selectionService.centerOnHorizontal();
      },
    });

    this.append({
      label: $t('Center Vertical'),
      click: () => {
        this.selectionService.centerOnVertical();
      },
    });

    this.append({ type: 'separator' });

    this.append({
      label: 'Flip Vertical',
      click: () => {
        this.selectionService.flipY();
      },
    });

    this.append({
      label: 'Flip Horizontal',
      click: () => {
        this.selectionService.flipX();
      },
    });

    this.append({ type: 'separator' });

    this.append({
      label: $t('Rotate 90 Degrees CW'),
      click: () => {
        this.selectionService.rotate(90);
      },
    });

    this.append({
      label: $t('Rotate 90 Degrees CCW'),
      click: () => {
        this.selectionService.rotate(-90);
      },
    });

    this.append({
      label: $t('Rotate 180 Degrees'),
      click: () => {
        this.selectionService.rotate(180);
      },
    });
  }
}
