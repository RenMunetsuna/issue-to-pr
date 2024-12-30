import type { Role } from '@prisma/client';
import type { Result } from '@/types';
import type { CreateUserRequest } from './schema';

type Params = {
  email: string;
  name: string;
  role: Role;
};

/**
 * ユーザー作成のパラメータを抽出
 */
export const extractParamsForCreateUser = (
  request: CreateUserRequest
): Result<Params, { errorCode: 400 }> => {
  const { email, name, role } = request.body;

  // メールアドレスのフォーマットチェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return { success: false, error: { errorCode: 400 } };

  // 名前の長さチェック
  if (name.length < 1 || name.length > 100)
    return { success: false, error: { errorCode: 400 } };

  // roleの値チェック
  if (role !== 'USER' && role !== 'ADMIN')
    return { success: false, error: { errorCode: 400 } };

  return {
    success: true,
    data: { email, name, role }
  };
};