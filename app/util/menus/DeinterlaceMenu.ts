import { Menu } from './Menu';
import { ScenesService } from 'services/scenes';
import { SelectionService } from 'services/selection';
import { Inject } from '../../util/injector';
import { $t } from 'services/i18n';
import { Source } from 'services/sources';
import { EDeinterlaceMode, EDeinterlaceFieldOrder } from 'obs-studio-node';

export class DeinterlaceMenu extends Menu {
  @Inject() private scenesService: ScenesService;
  @Inject() private selectionService: SelectionService;

  private source: Source;

  constructor(source: Source) {
    super();

    this.source = source;
    this.appendMenuItems();
  }

  appendMenuItems() {
    this.append({
      id: 'Disable',
      type: 'checkbox',
      checked: this.source.deinterlaceMode === EDeinterlaceMode.Disable,
      label: $t('deinterlace.disable'),
      click: () => { this.source.setDeinterlaceMode(EDeinterlaceMode.Disable) },
    });

    this.append({
      id: 'Discard',
      type: 'checkbox',
      checked: this.source.deinterlaceMode === EDeinterlaceMode.Discard,
      label: $t('deinterlace.discard'),
      click: () => { this.source.setDeinterlaceMode(EDeinterlaceMode.Discard) },
    });

    this.append({
      id: 'Retro',
      type: 'checkbox',
      checked: this.source.deinterlaceMode === EDeinterlaceMode.Retro,
      label: $t('deinterlace.retro'),
      click: () => { this.source.setDeinterlaceMode(EDeinterlaceMode.Retro) },
    });

    this.append({
      id: 'Blend',
      type: 'checkbox',
      checked: this.source.deinterlaceMode === EDeinterlaceMode.Blend,
      label: $t('deinterlace.blend'),
      click: () => { this.source.setDeinterlaceMode(EDeinterlaceMode.Blend) },
    });

    this.append({
      id: 'Blend 2x',
      type: 'checkbox',
      checked: this.source.deinterlaceMode === EDeinterlaceMode.Blend2X,
      label: $t('deinterlace.blend2x'),
      click: () => { this.source.setDeinterlaceMode(EDeinterlaceMode.Blend2X) },
    });

    this.append({
      id: 'Linear',
      type: 'checkbox',
      checked: this.source.deinterlaceMode === EDeinterlaceMode.Linear,
      label: $t('deinterlace.linear'),
      click: () => { this.source.setDeinterlaceMode(EDeinterlaceMode.Linear) },
    });

    this.append({
      id: 'Linear 2x',
      type: 'checkbox',
      checked: this.source.deinterlaceMode === EDeinterlaceMode.Linear2X,
      label: $t('deinterlace.linear2x'),
      click: () => { this.source.setDeinterlaceMode(EDeinterlaceMode.Linear2X) },
    });

    this.append({
      id: 'Yadif',
      type: 'checkbox',
      checked: this.source.deinterlaceMode === EDeinterlaceMode.Yadif,
      label: $t('deinterlace.yadif'),
      click: () => { this.source.setDeinterlaceMode(EDeinterlaceMode.Yadif) },
    });

    this.append({
      id: 'Yadif 2x',
      type: 'checkbox',
      checked: this.source.deinterlaceMode === EDeinterlaceMode.Yadif2X,
      label: $t('deinterlace.yadif2x'),
      click: () => { this.source.setDeinterlaceMode(EDeinterlaceMode.Yadif2X) },
    });

    this.append({ type: 'separator' });

    this.append({
      id: 'Top field first',
      type: 'checkbox',
      checked: this.source.deinterlaceFieldOrder === EDeinterlaceFieldOrder.Top,
      label: $t('deinterlace.top_field_first'),
      click: () => { this.source.setDeinterlaceFieldOrder(EDeinterlaceFieldOrder.Top) },
    });

    this.append({
      id: 'Bottom field first',
      type: 'checkbox',
      checked: this.source.deinterlaceFieldOrder === EDeinterlaceFieldOrder.Bottom,
      label: $t('deinterlace.bottom_field_first'),
      click: () => { this.source.setDeinterlaceFieldOrder(EDeinterlaceFieldOrder.Bottom) },
    });
  }
}