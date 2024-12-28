import type { PrismaClient, Role } from '@prisma/client';
import fastify from 'fastify';
import fastifyAutoLoad from '@/utils/railway/fastifyAutoLoad';

const accessToken = 'secure-token';

jest.mock('@/utils/validate/tokenValidation', () => ({
  verifyUser: jest.fn(() => Promise.resolve(true))
}));

/*
 * GET /app/users/:userId
 */
describe('/app/users/:userId', () => {
  const server = fastify();
  let testPrisma: PrismaClient;

  const mockUser = {
    id: 'clygt3jzi0009f2p0nrusvcc1',
    deviceNumber: 'testDeviceNumber'
  };

  beforeAll(async () => {
    const { default: createPrismaMock } = await import('prisma-mock');
    testPrisma = createPrismaMock();

    // Prismaのモックを設定
    jest.mock('@/lib', () => ({
      prisma: testPrisma
    }));

    await server.register(fastifyAutoLoad);
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  test('GET: 正常系 - ユーザー情報取得', async () => {
    const mockUserData = {
      id: mockUser.id,
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

    jest.spyOn(testPrisma.user, 'findUnique').mockResolvedValue(mockUserData);

    const response = await server.inject({
      method: 'GET',
      url: `/app/users/${mockUser.id}`,
      headers: {
        authorization: accessToken,
        'x-device-id': mockUser.deviceNumber
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: mockUserData.id,
      email: mockUserData.email,
      name: mockUserData.name,
      profile: {
        bio: mockUserData.profile.bio,
        avatar: mockUserData.profile.avatar,
        birthDate: mockUserData.profile.birthDate.toISOString(),
        location: mockUserData.profile.location
      },
      comments: [
        {
          id: mockUserData.comments[0].id,
          content: mockUserData.comments[0].content,
          createdAt: mockUserData.comments[0].createdAt.getTime()
        }
      ],
      createdAt: mockUserData.createdAt.getTime()
    });
  });

  test('GET: 異常系 - 不正なユーザーID形式', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/app/users/invalid-user-id',
      headers: {
        authorization: accessToken,
        'x-device-id': mockUser.deviceNumber
      }
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: 'リクエスト値が不正です'
    });
  });

  test('GET: 異常系 - ユーザーが存在しない', async () => {
    jest.spyOn(testPrisma.user, 'findUnique').mockResolvedValue(null);

    const response = await server.inject({
      method: 'GET',
      url: `/app/users/clygt3jzi0009f2p0nrusvcc2`,
      headers: {
        authorization: accessToken,
        'x-device-id': mockUser.deviceNumber
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'ユーザーが存在しません'
    });
  });

  test('GET: 異常系 - DBエラー', async () => {
    jest
      .spyOn(testPrisma.user, 'findUnique')
      .mockRejectedValue(new Error('DB error'));

    const response = await server.inject({
      method: 'GET',
      url: `/app/users/${mockUser.id}`,
      headers: {
        authorization: accessToken,
        'x-device-id': mockUser.deviceNumber
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'ユーザーが存在しません'
    });
  });
});
