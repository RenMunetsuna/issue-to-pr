import { createUserInDB } from './createUserInDB';
import { Prisma, UserRole } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';

describe('createUserInDB', () => {
  const mockPrisma = mockDeep<Prisma>();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new user when email is not taken', async () => {
    mockPris