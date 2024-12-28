import type { PrismaClient, Role } from '@prisma/client';
import { getUserFromDB } from './getUserFromDB';

describe('getUserFromDB', () => {
  let testPrisma: PrismaClient;

  const mockUser = {
    id: 'clygt3jzi0009f2p0nrusvcc1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER' as Role,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    profile: {
      bio: 'Test Bio',
      avatar: 'https://example.com/avatar.jpg',
      birthDate: new Date('1990-01-01'),
      location: 'Tokyo'
    },
    comments: [
      {
        id: 'comment1',
        content: 'Test Comment 1',
        createdAt: new Date('2024-01-02T00:00:00Z')
      }
    ]
  };

  beforeAll(async () => {
    const { default: createPrismaMock } = await import('prisma-mock');
    testPrisma = createPrismaMock();
  });

  test('正常系 - ユーザー情報取得', async () => {
    jest.spyOn(testPrisma.user, 'findUnique').mockResolvedValue(mockUser);

    const result = await getUserFromDB({
      userId: mockUser.id,
      prisma: testPrisma
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        profile: {
          bio: mockUser.profile.bio,
          avatar: mockUser.profile.avatar,
          birthDate: mockUser.profile.birthDate.toISOString(),
          location: mockUser.profile.location
        },
        comments: [
          {
            id: mockUser.comments[0].id,
            content: mockUser.comments[0].content,
            createdAt: mockUser.comments[0].createdAt.getTime()
          }
        ],
        createdAt: mockUser.createdAt.getTime()
      }
    });
  });

  test('正常系 - プロフィールが存在しないユーザー', async () => {
    const userWithoutProfile = {
      ...mockUser,
      profile: null
    };

    jest
      .spyOn(testPrisma.user, 'findUnique')
      .mockResolvedValue(userWithoutProfile);

    const result = await getUserFromDB({
      userId: mockUser.id,
      prisma: testPrisma
    });

    expect(result).toEqual({
      success: true,
      data: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        profile: {
          bio: null,
          avatar: null,
          birthDate: null,
          location: null
        },
        comments: [
          {
            id: mockUser.comments[0].id,
            content: mockUser.comments[0].content,
            createdAt: mockUser.comments[0].createdAt.getTime()
          }
        ],
        createdAt: mockUser.createdAt.getTime()
      }
    });
  });

  test('異常系 - ユーザーが存在しない', async () => {
    jest.spyOn(testPrisma.user, 'findUnique').mockResolvedValue(null);

    const result = await getUserFromDB({
      userId: 'non-existent-user',
      prisma: testPrisma
    });

    expect(result).toEqual({
      success: false,
      error: { errorCode: 600 }
    });
  });

  test('異常系 - DBエラー', async () => {
    jest
      .spyOn(testPrisma.user, 'findUnique')
      .mockRejectedValue(new Error('DB error'));

    const result = await getUserFromDB({
      userId: mockUser.id,
      prisma: testPrisma
    });

    expect(result).toEqual({
      success: false,
      error: { errorCode: 600 }
    });
  });
});
