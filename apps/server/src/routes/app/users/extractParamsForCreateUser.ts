import type { CreateUserRequest } from './schema';
import type { Result } from '@/types';
import { validate } from '@/utils/validate';

export const extractParamsForCreateUser = (
  request: CreateUserRequest
): Result<CreateUserRequest, { errorCode: 400 }> => {
  const { headers, body } = request;

  // バリデーション処理
  const errors = validate({
    headers: {
      authorization: headers.authorization,
      'x-device-id': headers['x-device-id']
    },
    body: {
      email: body.email,
      name: body.name,
      role: body.role
    }
  });

  if (errors.length > 0) {
    return { success: false, error: { errorCode: 400 } };
  }

  return { success: true, data: request };
};