import type { FastifyRequest } from 'fastify';
import { extractParamsForGetUser } from './extractParamsForGetUser';
import type { GetUserRequest } from './schema';

describe('extractParamsForGetUser', () => {
  // 正常なCUID
  const validUserId = 'clygt3jzi0009f2p0nrusvcc1';
  // 不正なCUID
  const invalidUserId = 'invalid-user-id';

  test('正常系 - 有効なユーザーID', () => {
    const request = {
      params: { userId: validUserId }
    } as FastifyRequest<GetUserRequest>;

    const result = extractParamsForGetUser(request);
    expect(result).toEqual({
      success: true,
      data: { userId: validUserId }
    });
  });

  test('異常系 - 不正なユーザーID形式', () => {
    const request = {
      params: { userId: invalidUserId }
    } as FastifyRequest<GetUserRequest>;

    const result = extractParamsForGetUser(request);
    expect(result).toEqual({
      success: false,
      error: { errorCode: 400 }
    });
  });
});
