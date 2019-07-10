import { Command } from './command';

export abstract class CombinableCommand extends Command {
  /**
   * Should return true if nextCommand should be combined with this command
   * @param nextCommand The next command that might be combined
   */
  abstract shouldCombine(nextCommand: CombinableCommand): boolean;

  /**
   * Should combine nextCommand with this command such that calling
   * calling execute() or rollback() will perform the combined result
   * of both commands.  Note that nextCommand has already been executed
   * in isolation and therefore should not be executed now.
   * @param nextCommand The next command to combine with this one
   */
  abstract combine(nextCommand: CombinableCommand): void;
}
