export abstract class Command {
  abstract description: string;

  abstract execute(): void;
  abstract rollback(): void;
}
