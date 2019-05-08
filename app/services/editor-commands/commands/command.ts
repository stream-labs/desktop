export abstract class Command {
  abstract execute(): void;
  abstract rollback(): void;
}
