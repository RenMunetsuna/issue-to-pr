import type { CreateUserRequest } from './schema';
import type { Result } from '@/types';

/**
 * ユーザー作成のパラメータを抽出
 */
export const extractParamsForCreateUser = (
  request: CreateUserRequest
): Result<{
  email: string;
  name: string;
  role: string;
}, { errorCode: 400 }> => {
  const { email, name, role } = request.body;

  if (!email || !name || !role) {
    return { success: false, error: { errorCode: 400 } };
  }

  return {
    success: true,
    data: {
      email,
      name,
      role
    }
  };
};