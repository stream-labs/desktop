import { Menu } from './Menu';
import { ScenesService } from 'services/scenes';
import { VideoService } from 'services/video';
import { SelectionService } from 'services/selection';
import { Inject } from '../../util/injector';

export class DeinterlaceMenu extends Menu {

  @Inject() private scenesService: ScenesService;
  @Inject() private videoService: VideoService;
  @Inject() private selectionService: SelectionService;

  constructor() {
    super();

    this.appendMenuItems();
  }


  appendMenuItems() {
    this.append({
      label: 'On',
      click: () => {
        this.selectionService.deinterlaceOn();
      }
    });

    this.append({
      label: 'Off',
      click: () => {
        this.selectionService.deinterlaceOff();
      }
    });
  }

}
