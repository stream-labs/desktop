import { CombinableCommand } from './combinable-command';
import obs from '../../../../obs-api';
import { Inject } from 'services/core';
import { AudioService } from 'services/audio';

export interface IChangableAudioSettings {
  forceMono?: boolean;
  syncOffset?: number;
  monitoringType?: obs.EMonitoringType;
  audioMixers?: number;
}

export class SetAudioSettingsCommand extends CombinableCommand {
  @Inject() audioService: AudioService;

  description: string;

  private beforeChanges: IChangableAudioSettings;
  private afterChanges: IChangableAudioSettings;

  constructor(private sourceId: string, private changes: IChangableAudioSettings) {
    super();
    this.description = `Edit ${this.audioService.getSource(this.sourceId).name}`;
  }

  execute() {
    this.beforeChanges = this.getAudioSettings();
    this.audioService.setSettings(this.sourceId, this.afterChanges || this.changes);
    this.afterChanges = this.getAudioSettings();
  }

  rollback() {
    this.audioService.setSettings(this.sourceId, this.beforeChanges);
  }

  shouldCombine(other: SetAudioSettingsCommand) {
    return this.sourceId === other.sourceId;
  }

  combine(other: SetAudioSettingsCommand) {
    this.afterChanges = other.afterChanges;
  }

  private getAudioSettings() {
    const source = this.audioService.getSource(this.sourceId);
    return {
      forceMono: source.forceMono,
      syncOffset: source.syncOffset,
      monitoringType: source.monitoringType,
      audioMixers: source.audioMixers,
    };
  }
}
