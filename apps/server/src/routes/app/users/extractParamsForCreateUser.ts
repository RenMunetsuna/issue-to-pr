import type { CreateUserRequest } from './schema';
import { validate } from '@/utils/validate';
import type { Result } from '@/types';

/**
 * ユーザー作成リクエストのパラメータを検証する
 */
export const extractParamsForCreateUser = (
  request: CreateUserRequest
): Result<Omit<CreateUserRequest['body'], 'role'> & { role: Role }, { errorCode: 400 }> => {
  const { email, name, role } = request.body;
  const validatedEmail = validate.email(email);
  const validatedName = validate.notEmptyString(name);

  if (!validatedEmail) return { error: { errorCode: 400 } };
  if (!validatedName) return { error: { errorCode: 400 } };

  const safeRole = Object.values(Role).includes(role)
    ? role
    : Role.USER;

  return { success: true, data: { email, name, role: safeRole } };
};