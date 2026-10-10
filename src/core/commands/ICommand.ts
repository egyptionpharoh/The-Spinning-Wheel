// /src/core/commands/ICommand.ts

export interface ICommand {
  execute(): void;
  undo(): void;
}