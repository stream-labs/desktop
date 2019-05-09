import { Service } from 'services/core/service';
import { Command } from './commands/command';
import * as commands from './commands';
import { CombinableCommand } from './commands/combinable-command';
import { shortcut } from 'services/shortcuts';
import { SelectionService } from 'services/selection';
import { Inject } from 'services/core/injector';
import { ENudgeDirection } from './commands/nudge-items';

const COMMANDS = { ...commands };

const COMBINE_TIMEOUT = 500;

export class EditorCommandsService extends Service {
  @Inject() selectionService: SelectionService;

  // TODO: Stateful service for visual command history?
  undoHistory: Command[] = [];
  redoHistory: Command[] = [];

  combineActive = false;

  combineTimeout: number;

  setCombineTimeout() {
    this.combineActive = true;

    if (this.combineTimeout) clearTimeout(this.combineTimeout);

    this.combineTimeout = window.setTimeout(() => {
      console.log('COMBINE TIMEOUT');
      this.combineActive = false;
      this.combineTimeout = null;
    }, COMBINE_TIMEOUT);
  }

  executeCommand<TCommand extends keyof typeof COMMANDS>(
    commandType: TCommand,
    ...commandArgs: ConstructorParameters<(typeof COMMANDS)[TCommand]>
  ) {
    // Executing any command clears out the redo history, since we are
    // creating a new branch in the timeline.
    this.redoHistory = [];

    const instance: Command = new (COMMANDS[commandType] as any)(...commandArgs);
    instance.execute();

    if (instance instanceof CombinableCommand) {
      if (this.combineActive) {
        const previousCommand = this.undoHistory[this.undoHistory.length - 1];
        if (previousCommand.constructor === instance.constructor) {
          // This check is actually redundant since we just checked the constructor
          // is the same above, but TypeScript isn't that smart.
          if (previousCommand instanceof CombinableCommand) {
            if (previousCommand.shouldCombine(instance)) {
              previousCommand.combine(instance);
              this.setCombineTimeout();
              return;
            }
          }
        }
      }

      this.setCombineTimeout();
    }

    this.undoHistory.push(instance);
  }

  @shortcut('Ctrl+Z')
  undo() {
    const command = this.undoHistory.pop();

    if (command) {
      command.rollback();
      this.redoHistory.push(command);
    }
  }

  @shortcut('Ctrl+Y')
  redo() {
    const command = this.redoHistory.pop();

    if (command) {
      command.execute();
      this.undoHistory.push(command);
    }
  }

  // Shortcuts for undo-able editor commands go here:
  @shortcut('ArrowLeft')
  nudgeActiveItemsLeft() {
    this.executeCommand(
      'NudgeItemsCommand',
      this.selectionService.getActiveSelection(),
      ENudgeDirection.Left,
    );
  }

  @shortcut('ArrowRight')
  nudgeActiveItemRight() {
    this.executeCommand(
      'NudgeItemsCommand',
      this.selectionService.getActiveSelection(),
      ENudgeDirection.Right,
    );
  }

  @shortcut('ArrowUp')
  nudgeActiveItemsUp() {
    this.executeCommand(
      'NudgeItemsCommand',
      this.selectionService.getActiveSelection(),
      ENudgeDirection.Up,
    );
  }

  @shortcut('ArrowDown')
  nudgeActiveItemsDown() {
    this.executeCommand(
      'NudgeItemsCommand',
      this.selectionService.getActiveSelection(),
      ENudgeDirection.Down,
    );
  }
}
