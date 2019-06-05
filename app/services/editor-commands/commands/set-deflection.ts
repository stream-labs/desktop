import { CombinableCommand } from './combinable-command';
import { AudioService } from 'services/audio';
import { Inject } from 'services/core/injector';

export class SetDeflectionCommand extends CombinableCommand {
  @Inject() private audioService: AudioService;

  private initialValue: number;
  private endValue: number;
  description: string;

  constructor(private sourceId: string, private deflection: number) {
    super();
    const source = this.audioService.getSource(this.sourceId);
    this.description = `Adjust ${source.name} volume`;
    this.initialValue = source.fader.deflection;
  }

  execute() {
    const source = this.audioService.getSource(this.sourceId);
    const deflection = this.endValue || this.deflection;
    source.setDeflection(deflection);
    this.endValue = deflection;
  }

  rollback() {
    const source = this.audioService.getSource(this.sourceId);
    source.setDeflection(this.initialValue);
  }

  shouldCombine(other: SetDeflectionCommand) {
    return this.sourceId === other.sourceId;
  }

  combine(other: SetDeflectionCommand) {
    this.endValue = other.endValue;
  }
}
