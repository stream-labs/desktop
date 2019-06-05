import { Command } from './command';
import { AudioService } from 'services/audio';
import { Inject } from 'services/core/injector';

export class MuteSourceCommand extends Command {
  @Inject() private audioService: AudioService;

  private oldValue: boolean;
  description: string;

  constructor(private sourceId: string, private muted: boolean) {
    super();
    const action = muted ? 'Mute' : 'Unmute';
    this.description = `${action} ${this.audioService.getSource(this.sourceId).name}`;
  }

  execute() {
    const source = this.audioService.getSource(this.sourceId);
    this.oldValue = source.muted;
    source.setMuted(this.muted);
  }

  rollback() {
    const source = this.audioService.getSource(this.sourceId);
    source.setMuted(this.oldValue);
  }
}
