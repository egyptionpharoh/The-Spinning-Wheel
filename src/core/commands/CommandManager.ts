// /src/core/commands/CommandManager.ts
import { ICommand } from './ICommand';

export class CommandManager {
  private historyStack: ICommand[] = [];

  public executeCommand(command: ICommand): void {
    command.execute();
    this.historyStack.push(command);
  }

  public undoLast(): void {
    const command = this.historyStack.pop();
    if (command) {
      command.undo();
    }
  }

  public canUndo(): boolean {
    return this.historyStack.length > 0;
  }

  public clearHistory(): void {
    this.historyStack = [];
  }
}