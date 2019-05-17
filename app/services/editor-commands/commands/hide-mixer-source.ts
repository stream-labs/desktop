import { Command } from './command';
import { Inject } from 'services/core';
import { AudioService } from 'services/audio';

export class HideMixerSourceCommand extends Command {
  @Inject() private audioService: AudioService;

  description: string;

  constructor(private sourceId: string) {
    super();
    this.description = `Hide ${this.audioService.getSource(this.sourceId).name}`;
  }

  execute() {
    this.audioService.getSource(this.sourceId).setHidden(true);
  }

  rollback() {
    this.audioService.getSource(this.sourceId).setHidden(false);
  }
}
