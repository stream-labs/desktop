import { Command } from './command';
import { ETransitionType, TransitionsService } from 'services/transitions';
import { Inject } from 'services/core';
import { $t } from 'services/i18n';

export class RemoveTransitionCommand extends Command {
  @Inject() private transitionsService: TransitionsService;

  private type: ETransitionType;
  private name: string;
  private settings: Dictionary<any>;
  private propertiesManagerSettings: Dictionary<any>;

  constructor(private transitionId: string) {
    super();
  }

  get description() {
    return $t('Remove %{transitionName}', { transitionName: this.name });
  }

  execute() {
    const transition = this.transitionsService.getTransition(this.transitionId);

    this.type = transition.type;
    this.name = transition.name;
    this.settings = this.transitionsService.getSettings(this.transitionId);
    this.propertiesManagerSettings = this.transitionsService.getPropertiesManagerSettings(
      this.transitionId,
    );

    this.transitionsService.deleteTransition(this.transitionId);
  }

  rollback() {
    this.transitionsService.createTransition(this.type, this.name, {
      id: this.transitionId,
      settings: this.settings,
      propertiesManagerSettings: this.propertiesManagerSettings,
    });
  }
}
