import { Command } from './command';
import { Inject } from 'services/core';
import { TransitionsService } from 'services/transitions';

export class RemoveConnectionCommand extends Command {
  @Inject() private transitionsService: TransitionsService;

  description = 'Remove a connection';

  private fromId: string;
  private toId: string;
  private transitionId: string;

  constructor(private connectionId: string) {
    super();
  }

  execute() {
    const connection = this.transitionsService.getConnection(this.connectionId);

    this.fromId = connection.fromSceneId;
    this.toId = connection.toSceneId;
    this.transitionId = connection.transitionId;

    this.transitionsService.deleteConnection(this.connectionId);
  }

  rollback() {
    this.transitionsService.addConnection(
      this.fromId,
      this.toId,
      this.transitionId,
      this.connectionId,
    );
  }
}
