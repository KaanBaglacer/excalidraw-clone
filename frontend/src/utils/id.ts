import { nanoid } from 'nanoid';

export function generateId(): string {
  return nanoid(10);
}

export function generateSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
