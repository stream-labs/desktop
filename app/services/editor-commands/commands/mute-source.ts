import { Command } from './command';
import { AudioService } from 'services/audio';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';

export class MuteSourceCommand extends Command {
  @Inject() private audioService: AudioService;

  private oldValue: boolean;
  description: string;

  constructor(private sourceId: string, private muted: boolean) {
    super();
    const action = muted ? 'Mute %{sourceName}' : 'Unmute %{sourceName}';
    this.description = $t(action, { sourceName: this.audioService.getSource(this.sourceId).name });
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
