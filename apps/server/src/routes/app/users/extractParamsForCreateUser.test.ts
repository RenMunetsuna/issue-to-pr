import { extractParamsForCreateUser } from './extractParamsForCreateUser';
import { UserRole } from '@prisma/client';

describe('extractParamsForCreateUser', () => {
  it('should return success when valid parameters are provided', () => {
    const request = {
      headers: {
        authorization: 'Bearer token',
        'x-device-id': 'device-id-1'
      },
      body: {
        email: 'user@example.com',
        name: 'John Doe',
        role: UserRole.USER
      }
    };

    const result = extractParamsForCreateUser(request);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(request);
  });

  it('should return error when invalid parameters are provided', () => {
    const request = {
      headers: {
        authorization: '',
        'x-device-id': ''
      },
      body: {
        email: 'invalid-email',
        name: '',
        role: 'invalid-role' as any
      }
    };

    const result = extractParamsForCreateUser(request);
    expect(result.success).toBe(false);
    expect(result.error).toEqual({ errorCode: 400 });
  });
});