import type { CreateUserRequest } from './schema';
import type { FastifyRequest } from 'fastify';
import { validateSchema } from '@/utils/validate';
import { schemas } from './schema';

/**
 * リクエストからユーザー作成用のパラメータを抽出する
 * @param request Fastifyリクエストオブジェクト
 * @returns パラメータオブジェクト、またはエラー
 */
export const extractParamsForCreateUser = async (
  request: FastifyRequest
): Promise<CreateUserRequest['body']> => {
  const { email, name, role } = request.body;
  const validatedParams = await validateSchema(schemas.post.body, { email, name, role });
  if (!validatedParams.success) {
    throw new Error('Invalid request parameters');
  }
  return validatedParams.data;
};