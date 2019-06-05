import { Command } from './command';
import { Inject } from 'services/core';
import { TransitionsService } from 'services/transitions';

export class SetDefaultTransitionCommand extends Command {
  @Inject() private transitionsService: TransitionsService;

  description = 'Change default transition';

  private oldDefaultId: string;

  constructor(private transitionId: string) {
    super();
  }

  execute() {
    this.oldDefaultId = this.transitionsService.getDefaultTransition().id;
    this.transitionsService.setDefaultTransition(this.transitionId);
  }

  rollback() {
    this.transitionsService.setDefaultTransition(this.oldDefaultId);
  }
}
