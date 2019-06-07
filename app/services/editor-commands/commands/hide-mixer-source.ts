import { Command } from './command';
import { Inject } from 'services/core';
import { AudioService } from 'services/audio';
import { $t } from 'services/i18n';

export class HideMixerSourceCommand extends Command {
  @Inject() private audioService: AudioService;

  description: string;

  constructor(private sourceId: string) {
    super();
    this.description = $t('Hide %{sourceName}', {
      sourceName: this.audioService.getSource(this.sourceId).name,
    });
  }

  execute() {
    this.audioService.getSource(this.sourceId).setHidden(true);
  }

  rollback() {
    this.audioService.getSource(this.sourceId).setHidden(false);
  }
}
