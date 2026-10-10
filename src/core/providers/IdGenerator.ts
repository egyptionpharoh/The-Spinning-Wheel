// src/core/providers/IdGenerator.ts

export interface IIdGenerator {
  generate(): string;
}

export class UUIDGenerator implements IIdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}