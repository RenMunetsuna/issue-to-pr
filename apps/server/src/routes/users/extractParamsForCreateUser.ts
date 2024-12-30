import type { FastifyRequest } from 'fastify';
import type { Result } from '@/types';
import type { CreateUserRequest } from './schema';

export const extractParamsForCreateUser = (
  request: FastifyRequest
): Result<
  {
    email: string;
    name: string;
    role: string;
  },
  { errorCode: 400 }
> => {
  const body = request.body as CreateUserRequest['body'];

  if (!body.email || !body.name || !body.role)
    return { success: false, error: { errorCode: 400 } };

  return {
    success: true,
    data: {
      email: body.email,
      name: body.name,
      role: body.role
    }
  };
};