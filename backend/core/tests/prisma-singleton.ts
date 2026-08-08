import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';

export const prismaMock = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});
