import { Command } from './command';
import { TransitionsService, ETransitionType } from 'services/transitions';
import { Inject } from 'services/core/injector';

export class CreateTransitionCommand extends Command {
  @Inject() private transitionsService: TransitionsService;

  description: string;

  private transitionId: string;

  constructor(private type: ETransitionType, private name: string) {
    super();

    this.description = `Create ${name}`;
  }

  execute() {
    const transition = this.transitionsService.createTransition(this.type, this.name, {
      id: this.transitionId,
    });

    this.transitionId = transition.id;

    return transition;
  }

  rollback() {
    this.transitionsService.deleteTransition(this.transitionId);
  }
}
