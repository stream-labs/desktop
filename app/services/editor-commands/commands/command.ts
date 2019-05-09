export abstract class Command {
  abstract description: string;

  abstract execute(): void | Promise<void>;
  abstract rollback(): void | Promise<void>;
}
