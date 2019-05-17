export abstract class Command {
  abstract description: string;

  abstract execute(): any;
  abstract rollback(): any;
}
