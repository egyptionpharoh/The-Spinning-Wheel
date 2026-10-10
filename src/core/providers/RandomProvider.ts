// /src/core/providers/RandomProvider.ts

export interface IRandomProvider {
  /** يرجع قيمة عشرية بين 0 و 1 */
  getFloat(): number;
  /** يرجع قيمة صحيحة بين min و max */
  getInt(min: number, max: number): number;
}

export class DefaultRandomProvider implements IRandomProvider {
  getFloat(): number {
    return Math.random();
  }

  getInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}